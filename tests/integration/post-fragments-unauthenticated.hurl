# Confirm that posting a fragment when not authenticated produces a 401 error
POST http://localhost:8080/v1/fragments
# We're sending a plain text fragment
Content-Type: text/plain
# Body of the request goes in ```...``` when it's a string
```This is a fragment!```

# We should get back an HTTP 1.1 401 response
HTTP/1.1 401
[Asserts]
header "Content-Type" startsWith "application/json"
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 401
jsonpath "$.error.message" isString