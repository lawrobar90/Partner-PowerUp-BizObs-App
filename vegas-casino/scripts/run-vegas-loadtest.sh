#!/bin/bash

# Vegas Slots LoadRunner Test Execution Script
# This script runs a 5-minute load test against the Vegas Slots application

set -e

# Configuration
SCRIPT_DIR="/home/ec2-user/loadrunner-scripts/Vegas-Slots-Load-Test"
LOADRUNNER_HOME="${LOADRUNNER_HOME:-/opt/HP/LoadRunner}"
RESULTS_DIR="/home/ec2-user/loadrunner-results"
TEST_DURATION=300  # 5 minutes in seconds
VIRTUAL_USERS=10   # Number of concurrent virtual users
RAMP_UP_TIME=60    # Time to ramp up all users (1 minute)
RAMP_DOWN_TIME=60  # Time to ramp down all users (1 minute)

# Server configuration
SERVER_HOST="localhost"
SERVER_PORT="3000"

# Test identification
TEST_NAME="Vegas_Slots_5Min_Load_Test_$(date +%Y%m%d_%H%M%S)"
TEST_ID="LR_$(date +%Y%m%d%H%M%S)"

echo "🎰 Vegas Slots LoadRunner Test Execution"
echo "========================================"
echo "Test Name: $TEST_NAME"
echo "Duration: $TEST_DURATION seconds (5 minutes)"
echo "Virtual Users: $VIRTUAL_USERS"
echo "Target Server: $SERVER_HOST:$SERVER_PORT"
echo "Script Location: $SCRIPT_DIR"
echo

# Function to check if Vegas application is running
check_vegas_app() {
    echo "🔍 Checking if Vegas application is running..."
    
    if ! curl -s -f "http://$SERVER_HOST:$SERVER_PORT/lobby.html" > /dev/null; then
        echo "❌ Vegas application is not accessible at http://$SERVER_HOST:$SERVER_PORT"
        echo "Please start the Vegas application first using:"
        echo "   cd /home/ec2-user/vegas-observability"
        echo "   nohup node dynatrace/server.js > server.log 2>&1 &"
        exit 1
    fi
    
    echo "✅ Vegas application is accessible"
}

# Function to setup results directory
setup_results_dir() {
    echo "📁 Setting up results directory..."
    
    mkdir -p "$RESULTS_DIR"
    CURRENT_TEST_DIR="$RESULTS_DIR/$TEST_NAME"
    mkdir -p "$CURRENT_TEST_DIR"
    
    echo "Results will be stored in: $CURRENT_TEST_DIR"
}

# Function to run LoadRunner test using command line
run_loadrunner_test() {
    echo "🚀 Starting LoadRunner test execution..."
    
    # Create scenario file
    SCENARIO_FILE="$CURRENT_TEST_DIR/vegas_slots_scenario.lrs"
    
    cat > "$SCENARIO_FILE" << EOF
[General]
Version=1.0
Type=LoadRunner Scenario

[Groups]
Group1="Vegas Slots Users"
    VUsers=$VIRTUAL_USERS
    Script=$SCRIPT_DIR/default.usr
    RampUp=$RAMP_UP_TIME
    Duration=$TEST_DURATION
    RampDown=$RAMP_DOWN_TIME
    
[Runtime Settings]
ThinkTime=Random
ThinkTimeMin=1
ThinkTimeMax=5
Iterations=Infinite
Pacing=AsEarly

[Parameters]
ServerHost=$SERVER_HOST
ServerPort=$SERVER_PORT
TestName=$TEST_NAME
TestRunId=$TEST_ID

[Monitoring]
EnableMonitoring=Yes
MonitorWindows=Yes
MonitorLinux=Yes

[Results]
ResultsDirectory=$CURRENT_TEST_DIR
AutoSaveResults=Yes
ResultsFormat=HTML
EOF

    echo "Scenario file created: $SCENARIO_FILE"
    
    # Check if LoadRunner Controller is available
    if command -v mmdrv > /dev/null 2>&1; then
        echo "Running with LoadRunner Controller..."
        
        # Run the scenario
        mmdrv -scenario "$SCENARIO_FILE" -run_mode "Manual" -results_dir "$CURRENT_TEST_DIR" &
        CONTROLLER_PID=$!
        
        echo "LoadRunner Controller started with PID: $CONTROLLER_PID"
        
        # Wait for test completion
        sleep $((TEST_DURATION + RAMP_UP_TIME + RAMP_DOWN_TIME + 30))
        
        echo "✅ LoadRunner test completed"
        
    elif command -v vugen > /dev/null 2>&1; then
        echo "Running with VuGen (single user mode)..."
        
        # Run single virtual user for demonstration
        cd "$SCRIPT_DIR"
        vugen -script_path "$SCRIPT_DIR" -run_mode "Verify" &
        VUGEN_PID=$!
        
        sleep $TEST_DURATION
        
        echo "✅ VuGen test completed"
        
    else
        echo "⚠️ LoadRunner binaries not found. Simulating test execution..."
        echo "This would normally execute the LoadRunner scenario."
        
        # Simulate test execution by running curl commands
        simulate_load_test
    fi
}

# Function to simulate load test using curl (fallback)
simulate_load_test() {
    echo "🔄 Simulating load test with curl commands..."
    
    START_TIME=$(date +%s)
    END_TIME=$((START_TIME + TEST_DURATION))
    USER_COUNT=$VIRTUAL_USERS
    
    # Create log file
    TEST_LOG="$CURRENT_TEST_DIR/simulation.log"
    echo "Load test simulation started at $(date)" > "$TEST_LOG"
    
    # Function to simulate a virtual user
    simulate_virtual_user() {
        local user_id=$1
        local username="LoadTest_User_$user_id"
        local user_log="$CURRENT_TEST_DIR/user_${user_id}.log"
        
        echo "Starting virtual user $user_id ($username)" >> "$user_log"
        
        while [ $(date +%s) -lt $END_TIME ]; do
            # Navigate to lobby
            curl -s -w "Response: %{http_code}, Time: %{time_total}s\n" \
                 -H "x-dynatrace-test: TSN=Navigate_To_Lobby;LSN=Vegas-Slots-Load-Test;LTN=$TEST_NAME;VU=$user_id;SI=LoadRunner" \
                 "http://$SERVER_HOST:$SERVER_PORT/lobby.html" >> "$user_log" 2>&1
            
            sleep $(shuf -i 1-3 -n 1)
            
            # Navigate to slots
            curl -s -w "Response: %{http_code}, Time: %{time_total}s\n" \
                 -H "x-dynatrace-test: TSN=Navigate_To_Slots;LSN=Vegas-Slots-Load-Test;LTN=$TEST_NAME;VU=$user_id;SI=LoadRunner" \
                 "http://$SERVER_HOST:$SERVER_PORT/vegas-slots.html" >> "$user_log" 2>&1
            
            sleep $(shuf -i 2-5 -n 1)
            
            # Perform slot spins
            local spins=$(shuf -i 3-8 -n 1)
            for ((spin=1; spin<=spins; spin++)); do
                local correlation_id="sim_${TEST_ID}_${user_id}_${spin}_$(date +%s)"
                local bet_amount=$(shuf -i 1-10 -n 1)
                local win_flag=$(shuf -i 0-1 -n 1)
                local win_amount=0
                local loss_amount=$bet_amount
                
                if [ $win_flag -eq 1 ]; then
                    win_amount=$((bet_amount * 5))
                    loss_amount=0
                fi
                
                # Spin API call
                curl -s -X POST \
                     -H "Content-Type: application/json" \
                     -H "x-dynatrace-test: TSN=Slot_Spin;LSN=Vegas-Slots-Load-Test;LTN=$TEST_NAME;VU=$user_id;SI=LoadRunner" \
                     -d "{
                         \"Game\":\"Vegas Slots Machine\",
                         \"BetAmount\":$bet_amount,
                         \"Username\":\"$username\",
                         \"WinFlag\":$win_flag,
                         \"WinningAmount\":$win_amount,
                         \"LossAmount\":$loss_amount,
                         \"Balance\":100,
                         \"Timestamp\":\"$(date -Iseconds)\",
                         \"Action\":\"Spin\",
                         \"Device\":\"LoadRunner-Simulation\",
                         \"CorrelationId\":\"$correlation_id\",
                         \"ResultIcons\":[\"dynatrace.png\",\"appsec.png\",\"dashboards.png\"],
                         \"Status\":\"Success\",
                         \"ErrorType\":null,
                         \"ErrorMessage\":null,
                         \"StatusCode\":200
                     }" \
                     -w "Spin $spin - Response: %{http_code}, Time: %{time_total}s\n" \
                     "http://$SERVER_HOST:$SERVER_PORT/api/slots/spin" >> "$user_log" 2>&1
                
                sleep $(shuf -i 1-3 -n 1)
            done
            
            # Return to lobby
            curl -s -w "Response: %{http_code}, Time: %{time_total}s\n" \
                 -H "x-dynatrace-test: TSN=Navigate_Back_To_Lobby;LSN=Vegas-Slots-Load-Test;LTN=$TEST_NAME;VU=$user_id;SI=LoadRunner" \
                 "http://$SERVER_HOST:$SERVER_PORT/lobby.html" >> "$user_log" 2>&1
            
            sleep $(shuf -i 5-10 -n 1)
        done
        
        echo "Virtual user $user_id completed at $(date)" >> "$user_log"
    }
    
    # Start virtual users in background
    echo "Starting $USER_COUNT virtual users..."
    for ((i=1; i<=USER_COUNT; i++)); do
        simulate_virtual_user $i &
        sleep $(echo "scale=1; $RAMP_UP_TIME / $USER_COUNT" | bc -l)
    done
    
    # Wait for test completion
    wait
    
    echo "Load test simulation completed at $(date)" >> "$TEST_LOG"
    echo "✅ Simulation completed. Check logs in: $CURRENT_TEST_DIR"
}

# Function to generate test report
generate_report() {
    echo "📊 Generating test report..."
    
    REPORT_FILE="$CURRENT_TEST_DIR/test_report.html"
    
    cat > "$REPORT_FILE" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Vegas Slots LoadRunner Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; }
        .metric { display: inline-block; margin: 10px; padding: 15px; background: #e8f4f8; border-radius: 5px; }
        .metric h3 { margin: 0; color: #2c3e50; }
        .metric p { margin: 5px 0; font-size: 18px; font-weight: bold; color: #27ae60; }
        pre { background: #f8f8f8; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎰 Vegas Slots LoadRunner Test Report</h1>
        <p><strong>Test Name:</strong> $TEST_NAME</p>
        <p><strong>Execution Time:</strong> $(date)</p>
        <p><strong>Duration:</strong> $TEST_DURATION seconds</p>
        <p><strong>Virtual Users:</strong> $VIRTUAL_USERS</p>
        <p><strong>Target Server:</strong> $SERVER_HOST:$SERVER_PORT</p>
    </div>
    
    <div class="section">
        <h2>Test Configuration</h2>
        <div class="metric">
            <h3>Duration</h3>
            <p>$TEST_DURATION sec</p>
        </div>
        <div class="metric">
            <h3>Virtual Users</h3>
            <p>$VIRTUAL_USERS</p>
        </div>
        <div class="metric">
            <h3>Ramp Up</h3>
            <p>$RAMP_UP_TIME sec</p>
        </div>
        <div class="metric">
            <h3>Ramp Down</h3>
            <p>$RAMP_DOWN_TIME sec</p>
        </div>
    </div>
    
    <div class="section">
        <h2>Dynatrace Integration</h2>
        <p>This test includes Dynatrace request tagging with the following headers:</p>
        <ul>
            <li><strong>TSN (Test Step Name):</strong> Navigate_To_Lobby, Navigate_To_Slots, Slot_Spin, Navigate_Back_To_Lobby</li>
            <li><strong>LSN (Load Script Name):</strong> Vegas-Slots-Load-Test</li>
            <li><strong>LTN (Load Test Name):</strong> $TEST_NAME</li>
            <li><strong>VU (Virtual User):</strong> 1-$VIRTUAL_USERS</li>
            <li><strong>SI (Source ID):</strong> LoadRunner</li>
        </ul>
    </div>
    
    <div class="section">
        <h2>Test Scenarios</h2>
        <ol>
            <li>Navigate to lobby page</li>
            <li>Navigate to Vegas Slots game</li>
            <li>Perform 3-8 random slot spins per session</li>
            <li>Return to lobby</li>
            <li>Repeat cycle until test duration expires</li>
        </ol>
    </div>
    
    <div class="section">
        <h2>Files Generated</h2>
        <ul>
            <li>Scenario File: vegas_slots_scenario.lrs</li>
            <li>Individual User Logs: user_*.log</li>
            <li>Simulation Log: simulation.log</li>
            <li>Test Report: test_report.html</li>
        </ul>
    </div>
    
    <div class="section">
        <h2>Dynatrace Analysis</h2>
        <p>To analyze the test results in Dynatrace:</p>
        <ol>
            <li>Navigate to Services in Dynatrace</li>
            <li>Look for your Vegas application service</li>
            <li>Filter by request attribute "Load test name" = "$TEST_NAME"</li>
            <li>Analyze response times, throughput, and error rates</li>
            <li>Review PurePaths for detailed transaction analysis</li>
        </ol>
    </div>
</body>
</html>
EOF

    echo "✅ Test report generated: $REPORT_FILE"
}

# Function to cleanup
cleanup() {
    echo "🧹 Cleaning up background processes..."
    # Kill any background curl processes
    pkill -f "curl.*$SERVER_HOST" 2>/dev/null || true
    echo "✅ Cleanup completed"
}

# Main execution
main() {
    echo "Starting Vegas Slots LoadRunner Test..."
    
    # Setup trap for cleanup
    trap cleanup EXIT INT TERM
    
    # Check prerequisites
    check_vegas_app
    
    # Setup
    setup_results_dir
    
    # Run test
    run_loadrunner_test
    
    # Generate report
    generate_report
    
    echo
    echo "🎉 Test execution completed successfully!"
    echo "📊 Results available at: $CURRENT_TEST_DIR"
    echo "📈 Open the test report: $CURRENT_TEST_DIR/test_report.html"
    echo
    echo "To analyze results in Dynatrace:"
    echo "1. Go to Services → Your Vegas Service"
    echo "2. Filter by 'Load test name' = '$TEST_NAME'"
    echo "3. Analyze performance metrics and PurePaths"
}

# Run main function
main "$@"