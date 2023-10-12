time=$(date "+%Y-%m-%d")
log="daily post $time"
echo "### commit: $log"
git add _posts/*.md 
git commit -m "$log"
git push origin main
