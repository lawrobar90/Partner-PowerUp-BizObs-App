/*
 * LoadRunner Script Generated from BizObs Journey Configuration
 * Company: Next
 * Domain: retail
 * Generated: 2025-11-27T10:30:00.000Z
 * Test ID: 550e8400-e29b-41d4-a716-446655440000
 * 
 * Dynatrace LoadRunner Integration with Request Tagging
 * LSN: BizObs_Next_Retail_Journey (Load Script Name)
 * TSN: ProductDiscovery, CartManagement, CheckoutProcess, etc. (Test Step Names)
 * LTN: Next_Performance_Test_20251127 (Load Test Name)
 */

#include "web_api.h"
#include "lrun.h"

// Global variables for Dynatrace tagging
char LSN[256] = "BizObs_Next_Retail_Journey";
char LTN[256] = "Next_Performance_Test_20251127";
char TSN[256] = "ProductDiscovery";
char dt_header[1024];
char company_name[128] = "Next";
char base_url[256] = "http://localhost:8080";

// Journey configuration
int journey_steps = 6;
int think_time_ms = 3000;
int error_simulation = 1;

Action()
{
    char step_name[256];
    char endpoint_url[512];
    char request_body[2048];
    int step_duration;
    
    // Initialize test execution
    lr_start_transaction("Journey_Initialization");
    
    sprintf(dt_header, "VU: %d; SI: %s; TSN: Journey_Start; LSN: %s; LTN: %s", 
            lr_get_vuser_id(), lr_get_session_id(), LSN, LTN);
    
    web_add_header("X-dynaTrace", dt_header);
    web_add_header("X-LoadRunner-Company", company_name);
    
    lr_end_transaction("Journey_Initialization", LR_PASS);
    
    // Step 1: Product Discovery Service
    execute_journey_step("ProductDiscovery", "/api/process", "POST", 
        "{\"companyName\":\"Next\",\"stepName\":\"ProductDiscovery\",\"substeps\":[{\"substepName\":\"Browse Categories\",\"duration\":5},{\"substepName\":\"Search Products\",\"duration\":8}]}", 
        13);
    
    // Step 2: Cart Management Service  
    execute_journey_step("CartManagement", "/api/process", "POST",
        "{\"companyName\":\"Next\",\"stepName\":\"CartManagement\",\"substeps\":[{\"substepName\":\"Add to Cart\",\"duration\":3},{\"substepName\":\"Update Quantities\",\"duration\":5}]}",
        8);
        
    // Step 3: Checkout Process Service
    execute_journey_step("CheckoutProcess", "/api/process", "POST",
        "{\"companyName\":\"Next\",\"stepName\":\"CheckoutProcess\",\"substeps\":[{\"substepName\":\"Payment Details\",\"duration\":12},{\"substepName\":\"Delivery Options\",\"duration\":7}]}",
        19);
    
    // Step 4: Order Confirmation Service
    execute_journey_step("OrderConfirmation", "/api/process", "POST",
        "{\"companyName\":\"Next\",\"stepName\":\"OrderConfirmation\",\"substeps\":[{\"substepName\":\"Process Payment\",\"duration\":8},{\"substepName\":\"Generate Receipt\",\"duration\":4}]}",
        12);
    
    // Step 5: Fulfillment Processing Service
    execute_journey_step("FulfillmentProcessing", "/api/process", "POST",
        "{\"companyName\":\"Next\",\"stepName\":\"FulfillmentProcessing\",\"substeps\":[{\"substepName\":\"Inventory Check\",\"duration\":6},{\"substepName\":\"Prepare Order\",\"duration\":15}]}",
        21);
    
    // Step 6: Delivery Tracking Service
    execute_journey_step("DeliveryTracking", "/api/process", "POST",
        "{\"companyName\":\"Next\",\"stepName\":\"DeliveryTracking\",\"substeps\":[{\"substepName\":\"Generate Tracking\",\"duration\":3},{\"substepName\":\"Send Notifications\",\"duration\":5}]}",
        8);
    
    // Final transaction summary
    lr_start_transaction("Journey_Complete");
    
    sprintf(dt_header, "VU: %d; SI: %s; TSN: Journey_Complete; LSN: %s; LTN: %s", 
            lr_get_vuser_id(), lr_get_session_id(), LSN, LTN);
    web_add_header("X-dynaTrace", dt_header);
    
    sprintf(request_body, 
        "{"
        "\"eventType\": \"JOURNEY_COMPLETE\","
        "\"companyName\": \"Next\","
        "\"testName\": \"%s\","
        "\"scriptName\": \"%s\","
        "\"vuserId\": %d,"
        "\"sessionId\": \"%s\","
        "\"timestamp\": \"2025-11-27T10:30:00.000Z\","
        "\"totalSteps\": 6"
        "}",
        LTN, LSN, lr_get_vuser_id(), lr_get_session_id()
    );
    
    web_custom_request("Journey_Summary",
        "URL={base_url}/api/journey-complete",
        "Method=POST",
        "Resource=0",
        "RecContentType=application/json",
        "Body={request_body}",
        LAST);
    
    lr_end_transaction("Journey_Complete", LR_PASS);
    
    return 0;
}

int execute_journey_step(char* step_name, char* endpoint, char* method, char* body, int duration)
{
    char transaction_name[256];
    char full_url[512];
    
    sprintf(transaction_name, "Step_%s", step_name);
    lr_start_transaction(transaction_name);
    
    sprintf(dt_header, "VU: %d; SI: %s; TSN: %s; LSN: %s; LTN: %s", 
            lr_get_vuser_id(), lr_get_session_id(), step_name, LSN, LTN);
    
    web_add_header("X-dynaTrace", dt_header);
    web_add_header("X-LoadRunner-Step", step_name);
    
    sprintf(full_url, "%s%s", base_url, endpoint);
    
    if (strcmp(method, "POST") == 0) {
        web_custom_request(step_name,
            "URL={full_url}",
            "Method=POST",
            "Resource=0",
            "RecContentType=application/json",
            "Body={body}",
            LAST);
    }
    
    lr_think_time(duration * 1000);
    
    if (error_simulation && (rand() % 100) < 5) {
        lr_end_transaction(transaction_name, LR_FAIL);
        lr_error_message("Simulated error in step: %s", step_name);
        return LR_FAIL;
    }
    
    lr_end_transaction(transaction_name, LR_PASS);
    return LR_PASS;
}