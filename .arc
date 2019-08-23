@aws
runtime nodejs10.x
bucket ghsc
profile default
region us-west-2

@app
ghsk

@http
get /
get /login
get /logout
get /dashboard
get /admin

@tables
users
  id *Number

apps
  id *String

# @indexes
# users
#   login String
# 
# apps
#   userId Number