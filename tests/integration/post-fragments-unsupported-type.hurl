# Confirm that posting an unsupported Content-Type produces a 415 error
POST http://localhost:8080/v1/fragments
# user1@email.com:password1
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==
# We're sending a unsupported content-type fragment
Content-Type: audio/mpeg
# Body of the request goes in ```...``` when it's a string
```Unsupported ...```

# We should get back an HTTP 1.1 415 response
HTTP/1.1 415
[Asserts]
header "Content-Type" startsWith "application/json"
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 415
jsonpath "$.error.message" isString