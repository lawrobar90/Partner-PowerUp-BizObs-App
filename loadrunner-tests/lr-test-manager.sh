#!/bin/bash

# BizObs LoadRunner Test Suite Manager
# Manages LoadRunner test generation, execution, and monitoring
# With comprehensive LSN/TSN/LTN support

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOADRUNNER_DIR="${SCRIPT_DIR}/loadrunner-tests"
SCENARIOS_DIR="${LOADRUNNER_DIR}/scenarios"
TEMPLATES_DIR="${LOADRUNNER_DIR}/templates"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Function to display usage
usage() {
    cat << EOF
BizObs LoadRunner Test Suite Manager

Usage: $0 [COMMAND] [OPTIONS]

Commands:
    generate        Generate LoadRunner scripts from BizObs journey
    list-scenarios  List available test scenarios
    list-tests      List generated test runs
    validate        Validate LoadRunner scripts
    clean           Clean old test runs
    monitor         Monitor active LoadRunner tests
    help           Show this help message

Options:
    -c, --company       Company name for journey generation
    -s, --scenario      Test scenario (light, medium, heavy, stress, spike)
    -d, --domain        Business domain
    -j, --journey-file  JSON journey configuration file
    -o, --output        Output directory for generated scripts
    -v, --verbose       Enable verbose output
    --lsn               Load Script Name override
    --ltn               Load Test Name override
    --dry-run          Show what would be generated without creating files

Examples:
    $0 generate -c "Next" -s medium -d retail
    $0 list-scenarios
    $0 validate UCB_2025-11-27T11-15-30-456Z
    $0 clean --older-than 7d
    $0 monitor --active-only

EOF
}

# List available scenarios
list_scenarios() {
    log "Available LoadRunner Test Scenarios:"
    echo ""
    
    for scenario_file in "${SCENARIOS_DIR}"/*.json; do
        if [[ -f "$scenario_file" ]]; then
            scenario_name=$(basename "$scenario_file" .json)
            description=$(jq -r '.description // "No description"' "$scenario_file")
            vusers=$(jq -r '.loadrunner_config.vusers // "N/A"' "$scenario_file")
            duration=$(jq -r '.loadrunner_config.duration // "N/A"' "$scenario_file")
            
            echo -e "${BLUE}Scenario:${NC} $scenario_name"
            echo -e "${GREEN}Description:${NC} $description"
            echo -e "${YELLOW}VUsers:${NC} $vusers | ${YELLOW}Duration:${NC} ${duration}s"
            echo ""
        fi
    done
}

# List generated test runs
list_tests() {
    log "Generated LoadRunner Test Runs:"
    echo ""
    
    if [[ ! -d "$LOADRUNNER_DIR" ]]; then
        warn "No LoadRunner tests directory found"
        return
    fi
    
    for test_dir in "${LOADRUNNER_DIR}"/*/; do
        if [[ -d "$test_dir" && "$test_dir" != *"templates"* && "$test_dir" != *"scenarios"* ]]; then
            test_name=$(basename "$test_dir")
            config_file="${test_dir}test-config.json"
            
            if [[ -f "$config_file" ]]; then
                company=$(jq -r '.testExecution.companyName // "Unknown"' "$config_file")
                domain=$(jq -r '.testExecution.domain // "Unknown"' "$config_file")
                scenario=$(jq -r '.testExecution.scenario // "Unknown"' "$config_file")
                generated_at=$(jq -r '.testExecution.generatedAt // "Unknown"' "$config_file")
                lsn=$(jq -r '.dynatraceIntegration.LSN // "N/A"' "$config_file")
                ltn=$(jq -r '.dynatraceIntegration.LTN // "N/A"' "$config_file")
                
                echo -e "${BLUE}Test Run:${NC} $test_name"
                echo -e "${GREEN}Company:${NC} $company | ${GREEN}Domain:${NC} $domain | ${GREEN}Scenario:${NC} $scenario"
                echo -e "${YELLOW}Generated:${NC} $generated_at"
                echo -e "${YELLOW}LSN:${NC} $lsn"
                echo -e "${YELLOW}LTN:${NC} $ltn"
                echo ""
            else
                echo -e "${RED}Test Run:${NC} $test_name (Missing config file)"
                echo ""
            fi
        fi
    done
}

# Validate LoadRunner scripts
validate_test() {
    local test_name="$1"
    local test_dir="${LOADRUNNER_DIR}/${test_name}"
    
    if [[ ! -d "$test_dir" ]]; then
        error "Test directory not found: $test_name"
        return 1
    fi
    
    log "Validating LoadRunner test: $test_name"
    
    # Check for required files
    local required_files=("test-config.json")
    local script_found=false
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "${test_dir}/${file}" ]]; then
            error "Missing required file: $file"
            return 1
        fi
    done
    
    # Check for LoadRunner script (.c file)
    for script_file in "${test_dir}"/*.c; do
        if [[ -f "$script_file" ]]; then
            script_found=true
            info "Found LoadRunner script: $(basename "$script_file")"
            
            # Basic syntax validation
            if grep -q "Action()" "$script_file" && grep -q "#include.*web_api.h" "$script_file"; then
                info "Script has basic LoadRunner structure"
            else
                warn "Script may be missing LoadRunner structure"
            fi
            
            # Check for Dynatrace integration
            if grep -q "LSN\|TSN\|LTN" "$script_file"; then
                info "Dynatrace tagging (LSN/TSN/LTN) found in script"
            else
                warn "Missing Dynatrace tagging in script"
            fi
        fi
    done
    
    if [[ "$script_found" == false ]]; then
        error "No LoadRunner script (.c file) found"
        return 1
    fi
    
    # Validate JSON configuration
    local config_file="${test_dir}/test-config.json"
    if ! jq empty "$config_file" 2>/dev/null; then
        error "Invalid JSON in test-config.json"
        return 1
    fi
    
    log "Test validation completed successfully"
    return 0
}

# Clean old test runs
clean_tests() {
    local older_than="${1:-30d}"  # Default 30 days
    
    log "Cleaning LoadRunner tests older than $older_than"
    
    # Convert time specification to find format
    local find_time_spec
    case "$older_than" in
        *d) find_time_spec="+${older_than%d}" ;;
        *h) find_time_spec="+$(( ${older_than%h} / 24 ))" ;;
        *) find_time_spec="+$older_than" ;;
    esac
    
    # Find and remove old test directories
    local removed_count=0
    
    find "${LOADRUNNER_DIR}" -maxdepth 1 -type d -mtime "$find_time_spec" | while read -r old_dir; do
        if [[ "$old_dir" != *"templates"* && "$old_dir" != *"scenarios"* && "$old_dir" != "$LOADRUNNER_DIR" ]]; then
            test_name=$(basename "$old_dir")
            info "Removing old test: $test_name"
            rm -rf "$old_dir"
            ((removed_count++))
        fi
    done
    
    log "Cleanup completed. Removed $removed_count old test runs."
}

# Monitor LoadRunner tests
monitor_tests() {
    local active_only=false
    
    if [[ "$1" == "--active-only" ]]; then
        active_only=true
    fi
    
    log "Monitoring LoadRunner Tests"
    echo ""
    
    # Check for running LoadRunner processes
    if pgrep -f "loadrunner\|lr_" > /dev/null; then
        info "Active LoadRunner processes found:"
        pgrep -af "loadrunner\|lr_"
        echo ""
    else
        info "No active LoadRunner processes detected"
        echo ""
    fi
    
    # Show recent test activity
    if [[ "$active_only" == false ]]; then
        info "Recent test runs (last 24 hours):"
        find "${LOADRUNNER_DIR}" -maxdepth 1 -type d -mtime -1 | while read -r recent_dir; do
            if [[ "$recent_dir" != *"templates"* && "$recent_dir" != *"scenarios"* && "$recent_dir" != "$LOADRUNNER_DIR" ]]; then
                test_name=$(basename "$recent_dir")
                echo "  - $test_name"
            fi
        done
    fi
}

# Main script logic
case "${1:-}" in
    generate)
        shift
        # This would integrate with the existing loadrunner-integration.js
        info "LoadRunner script generation should be triggered through the BizObs web interface"
        info "or via API call to: POST /api/loadrunner/generate"
        ;;
    list-scenarios)
        list_scenarios
        ;;
    list-tests|list)
        list_tests
        ;;
    validate)
        if [[ -z "${2:-}" ]]; then
            error "Test name required for validation"
            usage
            exit 1
        fi
        validate_test "$2"
        ;;
    clean)
        older_than="${2:-30d}"
        clean_tests "$older_than"
        ;;
    monitor)
        monitor_tests "${2:-}"
        ;;
    help|--help|-h)
        usage
        ;;
    *)
        error "Unknown command: ${1:-}"
        usage
        exit 1
        ;;
esac