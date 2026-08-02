import ProgressGauge from '@/src/components/ProgressGauge';
import TopBar from '@/src/components/TopBar';
import { supabase } from '@/src/lib/supabase';
import { colors, spacing } from '@/src/theme/theme';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProjectDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProject = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('projects').select('*').eq('id', id).single();
      if (error) throw error;
      setProject(data);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const startWork = async () => {
    if (!project) return;
    try {
      const { error } = await supabase.from('projects').update({ status: 'pending' }).eq('id', project.id);
      if (error) throw error;
      setProject({ ...project, status: 'pending' });
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update');
    }
  };

  const completeWork = async () => {
    if (!project) return;
    try {
      const { error } = await supabase.from('projects').update({ status: 'completed' }).eq('id', project.id);
      if (error) throw error;
      setProject({ ...project, status: 'completed' });
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to complete');
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!project) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Project not found</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TopBar title="Project Details" showBackButton={true} />

      <View style={styles.container}>
        {/* Progress Gauge (uses project.progress if available, else derive from status) */}
        <ProgressGauge progress={typeof project.progress === 'number' ? Math.max(0, Math.min(1, project.progress / 100)) : (project.status === 'completed' ? 1 : project.status === 'pending' ? 0.5 : 0)} />

        <View style={[styles.badge, { backgroundColor: project.color || colors.primary }]}>
          <Text style={styles.badgeText}>{project.type}</Text>
        </View>

        <Text style={styles.title}>{project.title}</Text>
        {project.desc ? <Text style={styles.desc}>{project.desc}</Text> : null}

        <View style={styles.row}>
          <MaterialIcons name="calendar-today" size={18} color="#666" />
          <Text style={styles.rowText}>
            {project.due_date ? new Date(project.due_date).toDateString() : 'No deadline'}
          </Text>
        </View>

        <View style={styles.row}>
          <Ionicons name="pricetag-outline" size={18} color="#666" />
          <Text style={styles.rowText}>Status: {project.status || 'draft'}</Text>
        </View>

        <View style={{ height: spacing.md }} />

        {project.status === 'draft' && (
          <TouchableOpacity style={styles.actionBtn} onPress={startWork}>
            <Text style={styles.actionText}>Start Work</Text>
          </TouchableOpacity>
        )}
        {project.status === 'pending' && (
          <TouchableOpacity style={styles.actionBtn} onPress={completeWork}>
            <Text style={styles.actionText}>Mark Completed</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#444' }]}
          onPress={() => router.push({ pathname: '/(protected)/addProjects', params: { projectId: project.id } })}
        >
          <Text style={styles.actionText}>Edit Project</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg },
  badge: { alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 },
  badgeText: { color: '#fff', fontWeight: '700' },
  title: { marginTop: spacing.sm, fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  desc: { marginTop: spacing.sm, fontSize: 14, color: colors.textSecondary },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  rowText: { marginLeft: 8, color: colors.textPrimary },
  actionBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionText: { color: '#fff', fontWeight: '700' },
});


