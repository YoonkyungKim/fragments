# Confirm that posting a jpeg image fragment works, and doing a GET for the same fragment returns the expected result
# Authenticated POST to /v1/fragments
POST http://localhost:8080/v1/fragments
#[MultipartFormData]
# user1@email.com:password1
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==
# We're sending a jpeg image fragment
Content-Type: image/jpeg
# Body of the request (file). Note: You should specify root folder when running it if file is not under the current folder.
file,testFiles/cat.jpeg;

# 1. We expect to get back an HTTP 201
HTTP/1.1 201
# We have various assertions about the response that we want to check 
[Asserts]
# The Location header should look like what we expect (including the fragment id)
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "image/jpeg"
# length of our fragment data
jsonpath "$.fragment.size" == 4497
# Capture the Location URL into a variable named `url`
[Captures]
url: header "Location"

# 2. Try to GET the fragment we just posted by its URL
GET {{url}}
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 200
Content-Length: 4497
[Asserts]
header "Content-Type" startsWith "image/jpeg"
