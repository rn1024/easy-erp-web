import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { lookup } from 'mime-types';

// GET /upload/[...path] - 静态文件服务
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // 构建文件路径
    const filePath = path.join(process.cwd(), 'upload', ...params.path);
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return new NextResponse('File not found', { status: 404 });
    }
    
    // 检查是否为文件（而不是目录）
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      return new NextResponse('Not a file', { status: 404 });
    }
    
    // 读取文件
    const fileBuffer = fs.readFileSync(filePath);
    
    // 获取MIME类型
    const mimeType = lookup(filePath) || 'application/octet-stream';
    
    // 返回文件
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Static file serve error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}