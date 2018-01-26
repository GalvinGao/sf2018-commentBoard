#!/bin/bash

$DIR = "$( cd "$( dirname "$0"  )" && pwd  )"
cd $DIR

npm install

export mysqlhost=""
export mysqlport=""
export mysqluser=""
export mysqlpassword=""
export mysqldatabase=""