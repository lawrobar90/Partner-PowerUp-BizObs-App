/*
 * Vegas Slots LoadRunner Globals Header
 * Contains global definitions and Dynatrace integration functions
 */

#ifndef GLOBALS_H
#define GLOBALS_H

#include "web_api.h"

// Global variables for test execution
extern char g_server_host[256];
extern char g_test_name[256];
extern int g_test_duration;

// Function to add Dynatrace test headers to HTTP requests
void addDynatraceHeaderTest(const char* transaction_name, const char* script_name, const char* test_name, int virtual_user_id)
{
    char dt_header_value[512];
    char vuser_id_str[16];
    
    sprintf(vuser_id_str, "%d", virtual_user_id);
    
    // Construct the x-dynatrace-test header value with key=value pairs
    sprintf(dt_header_value, 
        "TSN=%s;LSN=%s;LTN=%s;VU=%s;SI=LoadRunner", 
        transaction_name,    // Test Step Name
        script_name,         // Load Script Name  
        test_name,          // Load Test Name
        vuser_id_str        // Virtual User ID
    );
    
    // Add the header to the next web request
    web_add_header("x-dynatrace-test", dt_header_value);
    
    lr_log_message("Added Dynatrace header: %s", dt_header_value);
}

// Function to initialize test parameters
void initialize_test_parameters()
{
    // Set default server host if not provided
    if (strlen(lr_eval_string("{ServerHost}")) == 0) {
        lr_save_string("localhost", "ServerHost");
    }
    
    // Set test name
    sprintf(g_test_name, "Vegas_Slots_Load_Test_%s", lr_eval_string("{TestRunId}"));
    lr_save_string(g_test_name, "TestName");
    
    // Initialize random seed
    srand((unsigned int)time(NULL) + lr_get_vuser_id());
    
    // Generate random parameters
    lr_save_int(lr_rand() % 3 + 1, "BetAmount");  // 1, 2, or 3
    lr_save_int(lr_rand() % 2, "RandomWin");      // 0 or 1
    lr_save_int(lr_rand() % 100 + 50, "CurrentBalance");  // 50-149
    
    if (lr_eval_int("{RandomWin}") == 1) {
        lr_save_int(lr_eval_int("{BetAmount}") * 5, "WinAmount");
        lr_save_int(0, "LossAmount");
    } else {
        lr_save_int(0, "WinAmount");
        lr_save_int(lr_eval_int("{BetAmount}"), "LossAmount");
    }
    
    // Generate unique username
    char username[64];
    sprintf(username, "LoadTest_User_%d", lr_get_vuser_id());
    lr_save_string(username, "Username");
    
    // Generate unique test run ID if not provided
    if (strlen(lr_eval_string("{TestRunId}")) == 0) {
        char test_run_id[32];
        sprintf(test_run_id, "LR_%d_%d", (int)time(NULL), lr_get_vuser_id());
        lr_save_string(test_run_id, "TestRunId");
    }
}

// Function to generate correlation ID
void generate_correlation_id(const char* prefix)
{
    char correlation_id[128];
    sprintf(correlation_id, "%s_%d_%d_%d", 
        prefix, 
        (int)time(NULL), 
        lr_get_vuser_id(),
        lr_rand() % 10000
    );
    lr_save_string(correlation_id, "CorrelationId");
}

// Function to generate ISO timestamp
void generate_timestamp()
{
    time_t rawtime;
    struct tm * timeinfo;
    char timestamp[32];
    
    time(&rawtime);
    timeinfo = gmtime(&rawtime);
    
    strftime(timestamp, sizeof(timestamp), "%Y-%m-%dT%H:%M:%SZ", timeinfo);
    lr_save_string(timestamp, "CurrentTimestamp");
}

#endif // GLOBALS_H