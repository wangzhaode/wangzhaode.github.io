
## show

-   查看指定 commit 的某个文件内容: `git show <commit>:<file>`
-   查看指定 stash 的某个文件内容: `git show stash@{<id>}:<file>`

## stash

-   保存特定文件到 stash 中: `git stash -- <file>`

## rebase

-   合并多个commit: `git rebase -i HEAD~<n>` 要保留的使用`pick`, 要合并的使用`squash`



Reference:

