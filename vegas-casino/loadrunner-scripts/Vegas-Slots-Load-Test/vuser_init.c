/*
 * Vegas Slots LoadRunner Initialization Script
 * Sets up test environment and initializes global parameters
 */

#include "globals.h"

vuser_init()
{
    lr_log_message("=== Vegas Slots Load Test - Virtual User %d Starting ===", lr_get_vuser_id());
    
    // Initialize test parameters
    initialize_test_parameters();
    
    // Set HTTP options
    web_set_sockets_option("SSL_VERSION", "AUTO");
    web_set_option("UserAgent", "LoadRunner Vegas Slots Test Agent", LAST);
    web_set_option("MaxConnections", "6", LAST);
    
    // Enable detailed logging for debugging
    web_set_option("RecordReplay", "1", LAST);
    
    lr_log_message("Test initialized for user: %s", lr_eval_string("{Username}"));
    lr_log_message("Server host: %s", lr_eval_string("{ServerHost}"));
    lr_log_message("Test name: %s", lr_eval_string("{TestName}"));
    
    return 0;
}

vuser_end()
{
    lr_log_message("=== Vegas Slots Load Test - Virtual User %d Ending ===", lr_get_vuser_id());
    
    return 0;
}