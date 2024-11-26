# Setup

## Start up SQL Server
I did this using `brew install mysql`, then start up the server (in two ways)

1) Start now and at login: `brew services start mysql`, `shutdown with brew services stop mysql`, remove with `brew services remove mysql`
2) Start now but not at restart: `/opt/homebrew/opt/mysql/bin/mysqld_safe --datadir=/opt/homebrew/var/mysql`, shutdown with `/opt/homebrew/opt/mysql/bin/mysqladmin -u root -p shutdown`

Login and connect with `mysql -u root`


## Start up node backend
Scripts are added to *package.json* under *scripts*. Use `npm run build` after navigating to backend directory to convert typescript to javascript, then `npm run start` to start up the server. Errors with connecting to database / running commands should be printed to console.
