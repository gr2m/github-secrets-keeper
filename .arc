@aws
region us-west-2
profile default

@app
ghsk

@http
get /
get /login
get /logout
get /dashboard

@tables
users
  id *Number
# login String
# createdAt Number
# lastLoginAt Number

apps
  id *String
# userId Number
# secret String
# createdAt Number

@indexes
users
  login *String

apps
  userId Number