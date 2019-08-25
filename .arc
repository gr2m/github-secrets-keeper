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
get /api/:clientId/:code

@tables
users
  id *Number

apps
  clientId *String

# @indexes
# users
#   login String
# 
# apps
#   userId Number