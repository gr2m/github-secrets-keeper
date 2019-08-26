@aws
runtime nodejs10.x
bucket ghsc
profile default
region us-west-2

@app
ghsk

@static
folder public
# If no "get /" route is defined in the @http section,
# public/index.html is returned for all paths

@http
get /api/user/client-secrets # List OAuth app credentials for signed in user
post /api/user/client-secrets # Create new OAuth app credentials for signed in user
delete /api/user/client-secrets/:clientId # Delete OAuth client secret for signed in user
get /api/:clientId/:code # Get access token in exchange for OAuth App client_id and OAuth web flow code

@tables
users
  id *Number

apps
  clientId *String