import type { Response } from 'express';

class SSEServer {
  private clients: Map<string, Response> = new Map();
  private clientCounter = 0;
  
  registerClient(res: Response): string {
    const clientId = `client-${++this.clientCounter}`;
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Accel-Buffering', 'no');
    
    res.flushHeaders();
    
    res.write(`: SSE connection established\n\n`);
    
    this.clients.set(clientId, res);
    
    res.on('close', () => {
      this.clients.delete(clientId);
      console.log(`[SSE] Client ${clientId} disconnected`);
    });
    
    const keepAliveInterval = setInterval(() => {
      if (!this.clients.has(clientId)) {
        clearInterval(keepAliveInterval);
        return;
      }
      try {
        res.write(`: keep-alive\n\n`);
      } catch (error) {
        clearInterval(keepAliveInterval);
        this.clients.delete(clientId);
      }
    }, 30000);
    
    return clientId;
  }
  
  broadcast(event: string, data: any) {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    
    this.clients.forEach((client, clientId) => {
      try {
        client.write(message);
      } catch (error) {
        console.error(`[SSE] Error broadcasting to ${clientId}:`, error);
        this.clients.delete(clientId);
      }
    });
  }
  
  getClientCount(): number {
    return this.clients.size;
  }
}

export const sseServer = new SSEServer();
