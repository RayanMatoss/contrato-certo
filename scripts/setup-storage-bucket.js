/**
 * Script para criar o bucket de storage 'documents' no Supabase
 * 
 * Execute com: node scripts/setup-storage-bucket.js
 * 
 * Requer variáveis de ambiente no .env.local:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (chave de serviço, não a anon key)
 * 
 * Para obter a Service Role Key:
 * Dashboard > Settings > API > service_role key
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente do .env.local
function loadEnv() {
  try {
    const envPath = join(__dirname, '..', '.env.local');
    const envContent = readFileSync(envPath, 'utf-8');
    const env = {};
    
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
      }
    });
    
    return env;
  } catch (error) {
    return process.env;
  }
}

const env = loadEnv();

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.VITE_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ Erro: NEXT_PUBLIC_SUPABASE_URL não encontrada nas variáveis de ambiente');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('❌ Erro: SUPABASE_SERVICE_ROLE_KEY não encontrada nas variáveis de ambiente');
  console.error('💡 Você precisa da Service Role Key (não a anon key) para criar buckets');
  console.error('💡 Encontre ela em: Supabase Dashboard > Settings > API > service_role key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createBucket() {
  console.log('🚀 Criando bucket "documents"...\n');

  try {
    // Verificar se o bucket já existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      throw listError;
    }

    const bucketExists = buckets?.some(bucket => bucket.name === 'documents');

    if (bucketExists) {
      console.log('✅ Bucket "documents" já existe!');
      return;
    }

    // Criar o bucket
    const { data, error } = await supabase.storage.createBucket('documents', {
      public: false, // Bucket privado
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png'
      ]
    });

    if (error) {
      throw error;
    }

    console.log('✅ Bucket "documents" criado com sucesso!');
    console.log('\n📝 Próximos passos:');
    console.log('   1. Certifique-se de que a migration 004_storage_setup.sql foi executada');
    console.log('   2. As policies RLS já devem estar configuradas');
    console.log('   3. Teste fazendo upload de um documento na aplicação\n');

  } catch (error) {
    console.error('❌ Erro ao criar bucket:', error.message);
    console.error('\n💡 Alternativa: Crie o bucket manualmente no Dashboard do Supabase:');
    console.error('   1. Acesse Storage no Dashboard');
    console.error('   2. Clique em "New bucket"');
    console.error('   3. Nome: documents');
    console.error('   4. Público: Não (privado)');
    console.error('   5. Execute a migration 004_storage_setup.sql para as policies RLS\n');
    process.exit(1);
  }
}

createBucket();
