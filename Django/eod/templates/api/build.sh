#!/bin/bash
#
# Author: Bogdan Kulbida
# This builds API docs all together
#

ant
sed -i -e 's/EOD-API.html//g' ./EOD-API.html

echo "Built."

