---
layout: post
title:  "gradle downlaod slow"
date:   2023-10-11
last_modified_at: 2023-10-11
categories: [android]
---

1. gradle 下载
`gradle/wrapper/gradle-wrapper.properties`文件中修改`distributionUrl`
```
# 原始
distributionUrl=https\://services.gradle.org/distributions/gradle-8.0-bin.zip
# 修改为
distributionUrl=https\://downloads.gradle.org/distributions/gradle-8.0-bin.zip
```

2. 依赖下载
`settings.gradle`文件中修改`repositories`
```
pluginManagement {
    repositories {
        maven { url 'https://maven.aliyun.com/repository/gradle-plugin' }
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        maven { url 'https://plugins.gradle.org/m2/' }
        maven { url 'https://maven.aliyun.com/nexus/content/repositories/google' }
        maven { url 'https://maven.aliyun.com/nexus/content/groups/public' }
        maven { url 'https://maven.aliyun.com/nexus/content/repositories/jcenter'}
        google()
        mavenCentral()
    }
}
```

```