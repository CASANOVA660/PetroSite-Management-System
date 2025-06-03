# AI Model Setup for Petroleum RAG System

This guide will help you set up and deploy the AI models for the Petroleum RAG system, with options for both free and paid services.

## Hybrid Approach

The system now uses a hybrid approach with the following features:

1. **Primary Model**: Ollama (free, locally-hosted)
2. **Fallback Model**: OpenAI (paid, if Ollama isn't available)
3. **Embeddings**: OpenAI embeddings (paid, but will be used minimally)

This hybrid approach ensures that your system:
- Uses free resources when available
- Falls back to paid services only when necessary
- Remains functional even with minimal dependencies

## Setting Up Ollama (Free Option)

### 1. Install Ollama

Visit [ollama.ai](https://ollama.ai/) to download and install Ollama for your operating system (Windows, macOS, or Linux).

### 2. Run Ollama with the Llama 2 Model

After installing Ollama, run the following command in your terminal to download and start the Llama 2 model:

```bash
ollama run llama2
```

The first time you run this, it will download the model (approximately 4GB). This may take a few minutes depending on your internet connection.

## Hosting Options

### Option 1: Local Hosting (Free)

This is the simplest option and requires no additional costs:

1. Run Ollama on your development machine
2. Configure the backend to use `http://localhost:11434`
3. Your application will use your local resources for AI processing

### Option 2: Remote Server Hosting (Low Cost)

For production use, you can host Ollama on a low-cost VPS:

1. **Oracle Cloud Free Tier** (Free forever):
   - Offers 4 ARM-based OCPUs and 24GB RAM permanently free
   - Sufficient to run Ollama models
   - Set up: [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/)

2. **Google Cloud Free Tier**:
   - Includes an e2-micro VM instance
   - Limited resources but can run smaller models
   - Set up: [Google Cloud Free Tier](https://cloud.google.com/free)

3. **Digital Ocean** ($5-10/month):
   - 2GB RAM droplet can run smaller models
   - Easy setup and management
   - Set up: [Digital Ocean](https://www.digitalocean.com/pricing)

4. **Linode** ($5-10/month):
   - Similar to Digital Ocean, affordable and reliable
   - Set up: [Linode](https://www.linode.com/pricing/)

### Option 3: Hybrid Cloud-Local Solution

For the most flexible approach:

1. Host the main application on a standard web hosting service
2. Use LocalAI or Ollama on the user's machine for AI processing
3. Fall back to OpenAI when local resources aren't available

## Environment Variables

Make sure your `.env` file has the following variables:

```
# OpenAI Configuration (Fallback)
OPENAI_API_KEY=your-openai-key

# Ollama Configuration (Primary, Free)
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=llama2

# Embedding Configuration
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSION=1536
```

## Troubleshooting

- **Dependency Errors**: If you encounter dependency errors, use `npm install --legacy-peer-deps` to install packages
- **Ollama Connection Issues**: Ensure Ollama is running and accessible at the URL specified in your .env file
- **Performance Issues**: If responses are slow, try using a smaller model like llama2:7b

## Performance Considerations

- Local models generally perform somewhat slower than cloud-based APIs
- The first few responses might be slower as the model warms up
- Consider adding caching for common queries to improve response times

## Security Considerations

If you're hosting Ollama on a remote server:
- Set up a reverse proxy with HTTPS (Nginx/Caddy)
- Implement authentication
- Use firewalls to restrict access

## Available Models

You can use different models with Ollama. Some popular options:
- `llama2` - Default balanced model
- `mistral` - Good alternative model
- `llama2:7b` - Smaller model for low-resource machines
- `codellama` - Specialized for code

To use a different model, change the `OLLAMA_MODEL` environment variable. 