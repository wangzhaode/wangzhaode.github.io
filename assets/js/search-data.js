// get the ninja-keys element
const ninja = document.querySelector('ninja-keys');

// add the home and posts menu items
ninja.data = [{
    id: "nav-about",
    title: "about",
    section: "Navigation",
    handler: () => {
      window.location.href = "/";
    },
  },{id: "nav-blog",
          title: "blog",
          description: "Technical articles and insights on AI inference engines, on-device machine learning, LLM optimization, and computer architecture.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/blog/";
          },
        },{id: "nav-repositories",
          title: "repositories",
          description: "Explore open-source projects and live demos, including the MNN inference engine and other experiments in AI and machine learning.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/repositories/";
          },
        },{id: "post-mnn支持eagle3",
        
          title: "MNN支持Eagle3",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/mnn-eagle/";
          
        },
      },{id: "post-llm训练实战手册",
        
          title: "LLM训练实战手册",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/llm-train/";
          
        },
      },{id: "post-mnn模型支持-qwen3-vl",
        
          title: "MNN模型支持：Qwen3-VL",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/qwen3vl/";
          
        },
      },{id: "post-一图读懂qwen",
        
          title: "一图读懂Qwen",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/qwenfamily/";
          
        },
      },{id: "post-端侧llm硬件系列-二-内存容量",
        
          title: "端侧LLM硬件系列（二）：内存容量",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/device-llm-memory-capacity/";
          
        },
      },{id: "post-qwen3-next-下一代moe模型架构解析",
        
          title: "Qwen3-Next：下一代MoE模型架构解析",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/qwen3-next/";
          
        },
      },{id: "post-mnn模型支持-面壁小钢炮minicpm-v-4",
        
          title: "MNN模型支持：面壁小钢炮MiniCPM-V-4",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/minicpm/";
          
        },
      },{id: "post-端侧llm硬件系列-一-内存带宽",
        
          title: "端侧LLM硬件系列（一）：内存带宽",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/device-llm-memory-bandwidth/";
          
        },
      },{id: "post-coreml踩坑记-慎用conv1d",
        
          title: "CoreML踩坑记：慎用Conv1D",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/coreml-conv1d/";
          
        },
      },{id: "post-深入-gpt-oss-20b-架构-mnn-移动端性能实践",
        
          title: "深入 gpt-oss-20b 架构：MNN 移动端性能实践",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/gpt-oss/";
          
        },
      },{id: "post-混元端侧模型分析",
        
          title: "混元端侧模型分析",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/Hunyuan/";
          
        },
      },{id: "post-使用tee时获取exitcode",
        
          title: "使用tee时获取exitcode",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2024/exitcode/";
          
        },
      },{id: "post-gdb-lldb打印simd寄存器的值",
        
          title: "gdb/lldb打印SIMD寄存器的值",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2024/dump-register/";
          
        },
      },{id: "post-opencl特性",
        
          title: "opencl特性",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2023/opencl/";
          
        },
      },{id: "post-git常用指令备忘录",
        
          title: "git常用指令备忘录",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2023/git/";
          
        },
      },{id: "post-windows安装系统到指定磁盘",
        
          title: "windows安装系统到指定磁盘",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2023/windows-system/";
          
        },
      },{id: "post-arm64中的寄存器",
        
          title: "arm64中的寄存器",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2023/arm-register/";
          
        },
      },{id: "post-arm-neon汇编指令",
        
          title: "arm neon汇编指令",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2023/arm-instruction/";
          
        },
      },{id: "post-mac终端鼠标滚轮模式",
        
          title: "Mac终端鼠标滚轮模式",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2023/mouse/";
          
        },
      },{id: "post-内嵌汇编语法规则",
        
          title: "内嵌汇编语法规则",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2023/asm/";
          
        },
      },{id: "post-arm中的乘累加指令",
        
          title: "arm中的乘累加指令",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2023/arm-mac/";
          
        },
      },{id: "post-gemv-cpu实现",
        
          title: "gemv cpu实现",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2023/gemv/";
          
        },
      },{id: "post-python-main函数",
        
          title: "python main函数",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2023/python-main/";
          
        },
      },{id: "post-macos安装运行jekyll",
        
          title: "macos安装运行jekyll",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2023/jekyll/";
          
        },
      },{id: "post-将文件转换为字节数组",
        
          title: "将文件转换为字节数组",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2023/xxd/";
          
        },
      },{id: "post-mlc-llm-android-测试",
        
          title: "mlc-llm android 测试",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2023/mlc-llm/";
          
        },
      },{id: "post-gradle下载速度慢",
        
          title: "gradle下载速度慢",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2023/gradle-download/";
          
        },
      },{id: "post-终端打开-关闭光标",
        
          title: "终端打开、关闭光标",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2023/cursor/";
          
        },
      },{id: "post-arm-compute-library示例",
        
          title: "Arm Compute Library示例",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2023/acl-example/";
          
        },
      },{id: "post-segment-anything导出与部署",
        
          title: "segment-anything导出与部署",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2023/sam/";
          
        },
      },{id: "post-基于tiny-llama2训练",
        
          title: "基于tiny-llama2训练",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2023/tiny-llama2/";
          
        },
      },{id: "post-jax功能简介",
        
          title: "jax功能简介",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2023/jax/";
          
        },
      },{id: "post-adb中使用gdb调试",
        
          title: "adb中使用gdb调试",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2023/adb-gdb/";
          
        },
      },{
        id: 'social-email',
        title: 'email',
        section: 'Socials',
        handler: () => {
          window.open("mailto:%68%69@%7A%68%61%6F%64%65.%77%61%6E%67", "_blank");
        },
      },{
        id: 'social-github',
        title: 'GitHub',
        section: 'Socials',
        handler: () => {
          window.open("https://github.com/wangzhaode", "_blank");
        },
      },{
      id: 'light-theme',
      title: 'Change theme to light',
      description: 'Change the theme of the site to Light',
      section: 'Theme',
      handler: () => {
        setThemeSetting("light");
      },
    },
    {
      id: 'dark-theme',
      title: 'Change theme to dark',
      description: 'Change the theme of the site to Dark',
      section: 'Theme',
      handler: () => {
        setThemeSetting("dark");
      },
    },
    {
      id: 'system-theme',
      title: 'Use system default theme',
      description: 'Change the theme of the site to System Default',
      section: 'Theme',
      handler: () => {
        setThemeSetting("system");
      },
    },];
