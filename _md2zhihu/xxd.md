
在一些程序中可能需要将二进制文件转换成为字节数组，直接在代码中使用。比如图片资源，模型文件等，可以使用`xxd`程序转换。

```shell
xxd -i favicon.ico favicon.h
```

`favicon.h`内容如下：

```c
unsigned char favicon_ico[] = {
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x40, 0x40, 0x00, 0x00, 0x01, 0x00,
  ...,
  0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
  0xff, 0xff
};
unsigned int favicon_ico_len = 16958;
```

如果没有`xxd`程序，可以使用Python转换

```python
import binascii
import argparse
import os

def file_to_c_header(filename, output_file):
    array_name = os.path.splitext(os.path.basename(filename))[0]

    with open(filename, 'rb') as f:
        content = f.read()
        hex_string = binascii.hexlify(content).decode('ascii')

    # Generate C array
    array_elements = [f"0x{hex_string[i:i+2]}" for i in range(0, len(hex_string), 2)]
    array_lines = [', '.join(array_elements[i:i+16]) for i in range(0, len(array_elements), 16)]

    array_data = "\n    ".join(array_lines)
    array_length = len(content)

    header_content = f"""
#ifndef {array_name.upper()}_H
#define {array_name.upper()}_H

#include <stdint.h>
{% raw %}
static const unsigned char {array_name}[] = {{
    {array_data}
}};
{% endraw %}
static const unsigned int {array_name}_len = {array_length};

#endif // {array_name.upper()}_H
"""

    with open(output_file, 'w') as f:
        f.write(header_content)

    print(f"Header file '{output_file}' has been created.")

def main():
    parser = argparse.ArgumentParser(description="Convert a file to a C header file with a byte array")
    parser.add_argument("filename", help="File to convert")
    parser.add_argument("output_file", help="Output header file")

    args = parser.parse_args()

    file_to_c_header(args.filename, args.output_file)

if __name__ == "__main__":
    main()
```



Reference:

