# ACE-Box Auto-Provisioning Guide

## Dynamic External URL Detection

The `start-server.sh` script now automatically detects the ACE-Box environment and configures the correct external URL without manual intervention.

### How It Works

The script uses multiple detection methods in order of preference:

1. **Command Line Override** (Highest Priority)
   ```bash
   ./start-server.sh --ace-box-id=c469ba93-51c8-40eb-979d-1c9075a148a0
   ./start-server.sh --external-url=http://bizobs.myacebox.dynatrace.training
   ```

2. **Machine ID Detection**
   - Reads `/etc/machine-id` (first 8 characters)
   - Current example: `ec2c07e7` → `http://bizobs.ec2c07e7.dynatrace.training`

3. **Hostname Pattern Matching**
   - Looks for `ace-box-{UUID}` patterns in hostname
   - Extracts ACE-Box ID from hostname

4. **Process Pattern Extraction**
   - Scans running processes for UUID patterns
   - Uses first valid UUID found

5. **AWS Metadata Fallback**
   - Uses public IP: `http://{PUBLIC_IP}:8080`

6. **Localhost Fallback**
   - Final fallback: `http://localhost:8080`

### ACE-Box Domain Format

The script generates URLs in this format:
```
http://bizobs.{ACE_BOX_ID}.dynatrace.training
```

Where `{ACE_BOX_ID}` is typically a UUID or machine ID.

### Usage Examples

#### Automatic Detection (Recommended)
```bash
# Clone and run - everything auto-detected
git clone https://github.com/lawrobar90/Partner-PowerUp-BizObs-App.git
cd Partner-PowerUp-BizObs-App
./start-server.sh
```

#### Manual Override for Specific ACE-Box
```bash
# If auto-detection fails, specify ACE-Box ID manually
./start-server.sh --ace-box-id=c469ba93-51c8-40eb-979d-1c9075a148a0

# Or specify complete external URL
./start-server.sh --external-url=http://bizobs.c469ba93-51c8-40eb-979d-1c9075a148a0.dynatrace.training
```

#### Development/Testing Options
```bash
# Check environment without starting server
./start-server.sh --dry-run

# Force fresh clone and show real-time logs
./start-server.sh --force-clone --follow-logs

# Combination with manual ACE-Box ID
./start-server.sh --ace-box-id=YOUR_ACE_BOX_ID --follow-logs
```

### Verification

After startup, the script will display:
```
🌐 Detected ace-box environment: c469ba93-51c8-40eb-979d-1c9075a148a0.dynatrace.training
🔗 External URL will be: http://bizobs.c469ba93-51c8-40eb-979d-1c9075a148a0.dynatrace.training
```

### Troubleshooting

#### Auto-Detection Not Working?
1. Check the detection output during startup
2. Verify ACE-Box ID with: `cat /etc/machine-id | head -c 8`
3. Use manual override: `--ace-box-id=YOUR_ID`

#### External Access Not Working?
1. Verify ingress deployment (if Kubernetes available)
2. Check DNS resolution for `*.dynatrace.training`
3. Fall back to public IP: `--external-url=http://YOUR_PUBLIC_IP:8080`

#### Common ACE-Box ID Patterns
- Short form: `ec2c07e7` (8 characters from machine-id)
- UUID form: `c469ba93-51c8-40eb-979d-1c9075a148a0` (full UUID)
- Instance ID: `i-1234567890abcdef0` (AWS instance ID)

### Environment Variables Set

The script automatically configures these environment variables:
- `BIZOBS_EXTERNAL_URL`: Detected external URL
- `BIZOBS_ACE_BOX_ID`: Detected ACE-Box ID
- `BIZOBS_INSTANCE_ID`: AWS instance ID (if available)

### Integration with Dynatrace

The auto-detected URLs work seamlessly with:
- OneAgent Business Analytics capture rules
- Dynatrace monitoring and alerting
- Service discovery and tagging
- User session tracking

No manual configuration needed for Dynatrace integration!