time=$(date "+%Y-%m-%d")
name=$1
file=$time'-'$name'.md'
echo '### file is : '$file

# create file
touch $file

# create template
echo "---
layout: post
title:  ""
date:   $time
last_modified_at: $time
categories: []
---" > $file