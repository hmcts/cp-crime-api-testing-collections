TLS fix (verify APIM with your org CA)

1. Obtain the issuing or root CA certificate your APIM gateway uses (PEM text:
   -----BEGIN CERTIFICATE----- ... -----END CERTIFICATE-----).
   Your IT / platform team can provide this, or export it from your browser
   after inspecting the certificate chain for the APIM hostname.

2. Save it in this folder as:

     apim-ca.pem

   If curl still fails, concatenate root + intermediate CAs into one PEM file
   (several BEGIN/END CERTIFICATE blocks in order).

3. Run ./case.sh again.

Optional: set CURL_CACERT in case.env to any other PEM path instead.
