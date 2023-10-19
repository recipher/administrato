@app
scheduler

@aws
region eu-west-2
profile default
timeout 30

@http
/*
  method any
  src server

@static

@queues
generate-schedule
sync-holidays