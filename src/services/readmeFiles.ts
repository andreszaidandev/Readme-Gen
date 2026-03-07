import type { CreateReadmeFileInput, ReadmeFile, RepoInfo } from '../types';
import { getSupabaseClient } from './supabase';

type ReadmeFileRow = {
  id: string;
  user_id: string;
  title: string;
  repo_url: string;
  repo_full_name: string | null;
  repo_info: RepoInfo | null;
  markdown: string;
  created_at: string;
  updated_at: string;
};

const README_FILES_TABLE = 'readme_files';

function mapRowToReadmeFile(row: ReadmeFileRow): ReadmeFile {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    repoUrl: row.repo_url,
    repoFullName: row.repo_full_name,
    repoInfo: row.repo_info,
    markdown: row.markdown,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeStorageError(error: unknown, fallback: string): Error {
  if (error instanceof Error && error.message) {
    const raw = error.message.toLowerCase();

    if (raw.includes('relation') && raw.includes('readme_files') && raw.includes('does not exist')) {
      return new Error('Storage table is missing. Run supabase/readme_files.sql in Supabase SQL Editor.');
    }

    if (raw.includes('permission denied')) {
      return new Error('Database permissions are missing for readme_files. Re-run supabase/readme_files.sql.');
    }

    if (raw.includes('row-level security policy')) {
      return new Error('Row-level security blocked this operation. Re-run supabase/readme_files.sql and ensure you are signed in.');
    }

    return error;
  }
  return new Error(fallback);
}

export async function listUserReadmeFiles(): Promise<ReadmeFile[]> {
  const { data, error } = await getSupabaseClient()
    .from(README_FILES_TABLE)
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    throw normalizeStorageError(error, 'Failed to load README files.');
  }

  return ((data ?? []) as ReadmeFileRow[]).map(mapRowToReadmeFile);
}

export async function createReadmeFile(input: CreateReadmeFileInput): Promise<ReadmeFile> {
  const { data, error } = await getSupabaseClient()
    .from(README_FILES_TABLE)
    .insert({
      user_id: input.userId,
      title: input.title,
      repo_url: input.repoUrl,
      repo_full_name: input.repoFullName ?? null,
      repo_info: input.repoInfo ?? null,
      markdown: input.markdown,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw normalizeStorageError(error, 'Failed to create README file.');
  }

  return mapRowToReadmeFile(data as ReadmeFileRow);
}

export async function updateReadmeFileContent(id: string, markdown: string): Promise<ReadmeFile> {
  const { data, error } = await getSupabaseClient()
    .from(README_FILES_TABLE)
    .update({
      markdown,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) {
    throw normalizeStorageError(error, 'Failed to update README file content.');
  }

  return mapRowToReadmeFile(data as ReadmeFileRow);
}

export async function renameReadmeFile(id: string, title: string): Promise<ReadmeFile> {
  const { data, error } = await getSupabaseClient()
    .from(README_FILES_TABLE)
    .update({
      title,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) {
    throw normalizeStorageError(error, 'Failed to rename README file.');
  }

  return mapRowToReadmeFile(data as ReadmeFileRow);
}

export async function deleteReadmeFile(id: string): Promise<void> {
  const { error } = await getSupabaseClient().from(README_FILES_TABLE).delete().eq('id', id);

  if (error) {
    throw normalizeStorageError(error, 'Failed to delete README file.');
  }
}
