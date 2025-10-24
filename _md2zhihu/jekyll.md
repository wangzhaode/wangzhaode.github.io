
1.  更新ruby到最新版本

```shell
brew install ruby

...
By default, binaries installed by gem will be placed into:
  /opt/homebrew/lib/ruby/gems/3.4.0/bin

You may want to add this to your PATH.

ruby is keg-only, which means it was not symlinked into /opt/homebrew,
because macOS already provides this software and installing another version in
parallel can cause all kinds of trouble.

If you need to have ruby first in your PATH, run:
  echo 'export PATH="/opt/homebrew/opt/ruby/bin:$PATH"' >> ~/.zshrc

For compilers to find ruby you may need to set:
  export LDFLAGS="-L/opt/homebrew/opt/ruby/lib"
  export CPPFLAGS="-I/opt/homebrew/opt/ruby/include"

For pkg-config to find ruby you may need to set:
  export PKG_CONFIG_PATH="/opt/homebrew/opt/ruby/lib/pkgconfig"
```

接下来直接使用`/opt/homebrew/opt/ruby/bin`目录下的`gem`

1.  修改源

```shell
/opt/homebrew/opt/ruby/bin/gem sources --remove https://gems.ruby-china.com/
/opt/homebrew/opt/ruby/bin/gem sources -a https://mirrors.cloud.tencent.com/rubygems/
```

1.  安装

```shell
/opt/homebrew/opt/ruby/bin/gem install jekyll github-pages
/opt/homebrew/opt/ruby/bin/bundle add webrick
```

1.  运行

```shell
/opt/homebrew/opt/ruby/bin/bundle exec jekyll serve
```



Reference:

