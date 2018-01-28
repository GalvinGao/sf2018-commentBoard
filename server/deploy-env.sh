#!/bin/bash

export mysqlhost=""
export mysqlport=""
export mysqluser=""
export mysqlpassword=""
export mysqldatabase=""

$DIR = "$( cd "$( dirname "$0"  )" && pwd  )"
cd $DIR

npm install