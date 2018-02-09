#!/usr/bin/python

import pyping;
import os;

#with open('server.list', 'r') as f:
#  serverFile = f.read()

servers = [
  { "name": "mainservice", "ip": "10.1.1.1" },
  { "name": "maindatabase", "ip": "10.1.1.2" },
  { "name": "backupservice", "ip": "10.1.2.1" },
  { "name": "backupdatabase", "ip": "10.1.2.2" },
  { "name": "google", "ip": "8.8.8.8" }
];

for entry in servers:
  ip = entry['ip'];
  pingr = os.system("ping "+ip+" -w 2 -i 1 -c 1");
  print(pingr);
  if pingr == 0:
    print("Reachable: ", ip);
  else:
    print("Unreachable: ", ip);