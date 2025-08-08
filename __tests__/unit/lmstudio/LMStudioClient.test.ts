import axios from 'axios';
import { LMStudioClient, LMStudioConfig } from '../../../src/lmstudio/LMStudioClient';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('LMStudioClient', () => {
  let client: LMStudioClient;
  const defaultConfig = {
    endpoint: 'http://localhost:1234',
    model: 'test-model',
    timeout: 30000,
    maxTokens: 2048
  };

  beforeEach(() => {
    client = new LMStudioClient(defaultConfig);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should use default config when no config provided', () => {
      const defaultClient = new LMStudioClient();
      expect(defaultClient).toBeDefined();
    });

    it('should merge provided config with defaults', () => {
      const customConfig: Partial<LMStudioConfig> = {
        endpoint: 'http://custom:1234',
        model: 'custom-model'
      };
      const customClient = new LMStudioClient(customConfig);
      expect(customClient).toBeDefined();
    });
  });

  describe('sendMessage', () => {
    it('should send message and return response', async () => {
      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content: 'Test response'
              }
            }
          ]
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await client.sendMessage('Test message');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:1234/v1/chat/completions',
        {
          model: 'test-model',
          messages: [{ role: 'user', content: 'Test message' }],
          max_tokens: 2048,
          temperature: 0.7
        },
        { headers: {}, timeout: 30000 }
      );
      expect(result).toBe('Test response');
    });

    it('should return default message when no response content', async () => {
      const mockResponse = {
        data: {
          choices: []
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await client.sendMessage('Test message');
      expect(result).toBe('No response received');
    });

    it('should handle API errors', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(client.sendMessage('Test message')).rejects.toThrow('Network error');
    });
  });

  describe('listModels', () => {
    it('should return list of model IDs', async () => {
      const mockResponse = {
        data: {
          data: [
            { id: 'model1' },
            { id: 'model2' }
          ]
        }
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await client.listModels();

      expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:1234/v1/models', { headers: {}, timeout: 30000 });
      expect(result).toEqual(['model1', 'model2']);
    });

    it('should return empty array on error', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      const result = await client.listModels();
      expect(result).toEqual([]);
    });
  });

  describe('analyzeWorkspace', () => {
    it('should analyze workspace structure', async () => {
      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content: 'Workspace analysis result'
              }
            }
          ]
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await client.analyzeWorkspace('src/\n  index.ts\n  utils/');

      expect(result).toBe('Workspace analysis result');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:1234/v1/chat/completions',
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('Analyze this project structure')
            })
          ])
        }),
        { headers: {}, timeout: 30000 }
      );
    });

    it('should detect high-risk workspace', async () => {
      const highRiskStructure = 'rm -rf / dangerous command';
      
      const result = await client.analyzeWorkspace(highRiskStructure);
      
      expect(result).toContain('High-risk workspace detected');
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });
  });

  describe('executeAgentTask', () => {
    it('should execute agent task successfully', async () => {
      const mockResponse = {
        data: {
          taskId: '123',
          status: 'completed'
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await client.executeAgentTask('Create a new component');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:1234/v1/agent/tasks',
        {
          description: 'Create a new component',
          max_tokens: 2048,
          temperature: 0.7
        }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle agent task errors', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Task execution failed'));

      await expect(client.executeAgentTask('Invalid task')).rejects.toThrow('Agent task failed: Task execution failed');
    });
  });

  describe('applyChange', () => {
    it('should apply change successfully', async () => {
      const mockResponse = {
        data: {
          changeId: '123',
          status: 'applied'
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await client.applyChange('123', 'src/test.ts');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:1234/v1/changes/apply',
        {
          id: '123',
          file_path: 'src/test.ts'
        }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should apply change without file path', async () => {
      const mockResponse = {
        data: {
          changeId: '123',
          status: 'applied'
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await client.applyChange('123');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:1234/v1/changes/apply',
        {
          id: '123'
        }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle change application errors', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Change application failed'));

      await expect(client.applyChange('123')).rejects.toThrow('Change application failed: Change application failed');
    });
  });
});
