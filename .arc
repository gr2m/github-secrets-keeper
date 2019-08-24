@aws
runtime nodejs10.x
bucket ghsc
profile default
region us-west-2

@app
ghsk

@static
folder public

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