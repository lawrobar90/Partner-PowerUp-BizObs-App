/*
 * Vegas Slots LoadRunner Performance Test Script
 * Targets: Vegas Slots Application with Dynatrace Integration
 * Scenario: User login, multiple slot spins, logout
 */

#include "web_api.h"
#include "lrun.h"
#include "globals.h"

Action()
{
    char *correlation_id;
    char *username;
    char *bet_amount;
    char *timestamp;
    int spin_count;
    int i;
    
    lr_start_transaction("Vegas_Slots_Complete_Session");
    
    // Initialize test data
    generate_correlation_id("vegas_session");
    username = lr_eval_string("{Username}");
    bet_amount = lr_eval_string("{BetAmount}");
    
    lr_start_transaction("Navigate_To_Lobby");
    
    // Add Dynatrace headers for lobby navigation
    addDynatraceHeaderTest("Navigate_To_Lobby", "Vegas-Slots-Load-Test", lr_eval_string("{TestName}"), lr_get_vuser_id());
    
    // Navigate to lobby
    web_url("Lobby_Page",
        "URL=http://{ServerHost}:3000/lobby.html",
        "Resource=0",
        "RecContentType=text/html",
        "Referer=",
        "Snapshot=t1.inf",
        "Mode=HTML",
        LAST);
        
    lr_end_transaction("Navigate_To_Lobby", LR_AUTO);
    
    lr_think_time(2);
    
    lr_start_transaction("Navigate_To_Slots");
    
    // Add Dynatrace headers for slots navigation
    addDynatraceHeaderTest("Navigate_To_Slots", "Vegas-Slots-Load-Test", lr_eval_string("{TestName}"), lr_get_vuser_id());
    
    // Navigate to slots game
    web_url("Slots_Game",
        "URL=http://{ServerHost}:3000/vegas-slots.html",
        "Resource=0",
        "RecContentType=text/html",
        "Referer=http://{ServerHost}:3000/lobby.html",
        "Snapshot=t2.inf",
        "Mode=HTML",
        LAST);
        
    lr_end_transaction("Navigate_To_Slots", LR_AUTO);
    
    lr_think_time(3);
    
    // Perform multiple spins (randomized between 3-10)
    spin_count = lr_rand() % 8 + 3;  // Random between 3-10 spins
    
    for(i = 1; i <= spin_count; i++)
    {
        lr_start_transaction("Slot_Spin");
        
        // Generate fresh timestamp and correlation ID for each spin
        generate_timestamp();
        generate_correlation_id("spin");
        
        // Add Dynatrace headers for slot spin
        addDynatraceHeaderTest("Slot_Spin", "Vegas-Slots-Load-Test", lr_eval_string("{TestName}"), lr_get_vuser_id());
        
        // Simulate slot spin API call with proper JSON formatting
        web_custom_request("Spin_Request",
            "URL=http://{ServerHost}:3000/api/slots/spin",
            "Method=POST",
            "Resource=0",
            "RecContentType=application/json",
            "Referer=http://{ServerHost}:3000/vegas-slots.html",
            "Snapshot=t_spin_{SpinNumber}.inf",
            "Mode=HTML",
            "EncodeAtSign=YES",
            "Body={"
            "\\\"Game\\\":\\\"Vegas Slots Machine\\\","
            "\\\"BetAmount\\\":{BetAmount},"
            "\\\"Username\\\":\\\"{Username}\\\","
            "\\\"WinFlag\\\":{RandomWin},"
            "\\\"WinningAmount\\\":{WinAmount},"
            "\\\"LossAmount\\\":{LossAmount},"
            "\\\"Balance\\\":{CurrentBalance},"
            "\\\"Timestamp\\\":\\\"{CurrentTimestamp}\\\","
            "\\\"Action\\\":\\\"Spin\\\","
            "\\\"Device\\\":\\\"LoadRunner\\\","
            "\\\"CorrelationId\\\":\\\"{CorrelationId}\\\","
            "\\\"ResultIcons\\\":[\\\"dynatrace.png\\\",\\\"appsec.png\\\",\\\"dashboards.png\\\"],"
            "\\\"Status\\\":\\\"Success\\\","
            "\\\"ErrorType\\\":null,"
            "\\\"ErrorMessage\\\":null,"
            "\\\"StatusCode\\\":200"
            "}",
            EXTRARES,
            "Url=http://{ServerHost}:3000/slot-icons/dynatrace.png", ENDITEM,
            "Url=http://{ServerHost}:3000/slot-icons/appsec.png", ENDITEM,  
            "Url=http://{ServerHost}:3000/slot-icons/dashboards.png", ENDITEM,
            LAST);
            
        lr_end_transaction("Slot_Spin", LR_AUTO);
        
        // Think time between spins (1-5 seconds)
        lr_think_time(lr_rand() % 5 + 1);
    }
    
    lr_start_transaction("Navigate_Back_To_Lobby");
    
    // Add Dynatrace headers for return to lobby
    addDynatraceHeaderTest("Navigate_Back_To_Lobby", "Vegas-Slots-Load-Test", lr_eval_string("{TestName}"), lr_get_vuser_id());
    
    // Navigate back to lobby
    web_url("Return_To_Lobby",
        "URL=http://{ServerHost}:3000/lobby.html",
        "Resource=0",
        "RecContentType=text/html",
        "Referer=http://{ServerHost}:3000/vegas-slots.html",
        "Snapshot=t_final.inf",
        "Mode=HTML",
        LAST);
        
    lr_end_transaction("Navigate_Back_To_Lobby", LR_AUTO);
    
    lr_end_transaction("Vegas_Slots_Complete_Session", LR_AUTO);
    
    return 0;
}