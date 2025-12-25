import { Router } from 'express';
import { nanoid } from 'nanoid';
import { UAParser } from 'ua-parser-js';
import supabase from '../db/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Track proposal view
router.post('/views', async (req, res) => {
  try {
    const {
      proposalId,
      linkId,
      sessionId: providedSessionId,
      ipAddress,
      userAgent,
    } = req.body;

    if (!proposalId) {
      res.status(400).json({ error: 'proposalId is required' });
      return;
    }

    const sessionId = providedSessionId || nanoid();
    const ua = userAgent ? new UAParser(userAgent) : null;

    const { data: view, error } = await supabase
      .from('proposal_views')
      .insert({
        proposal_id: proposalId,
        link_id: linkId || null,
        session_id: sessionId,
        ip_address: ipAddress || null,
        user_agent: userAgent || null,
        device_type: ua?.getDevice().type || 'desktop',
        browser: ua?.getBrowser().name || null,
        os: ua?.getOS().name || null,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      viewId: view.id,
      sessionId,
    });
  } catch (error) {
    console.error('Track view error:', error);
    res.status(500).json({ error: 'Failed to track view' });
  }
});

// Update view duration
router.patch('/views/:viewId/duration', async (req, res) => {
  try {
    const viewId = parseInt(req.params.viewId);
    const { durationSeconds } = req.body;

    const { error } = await supabase
      .from('proposal_views')
      .update({ duration_seconds: durationSeconds })
      .eq('id', viewId);

    if (error) throw error;

    res.json({ message: 'Duration updated' });
  } catch (error) {
    console.error('Update duration error:', error);
    res.status(500).json({ error: 'Failed to update duration' });
  }
});

// Track interaction (for heatmaps)
router.post('/interactions', async (req, res) => {
  try {
    const {
      viewId,
      proposalId,
      interactionType,
      elementId,
      elementType,
      xPosition,
      yPosition,
      scrollDepth,
    } = req.body;

    if (!viewId || !proposalId || !interactionType) {
      res.status(400).json({ error: 'viewId, proposalId, and interactionType are required' });
      return;
    }

    const { error } = await supabase
      .from('proposal_interactions')
      .insert({
        view_id: viewId,
        proposal_id: proposalId,
        interaction_type: interactionType,
        element_id: elementId || null,
        element_type: elementType || null,
        x_position: xPosition || null,
        y_position: yPosition || null,
        scroll_depth: scrollDepth || null,
      });

    if (error) throw error;

    res.status(201).json({ message: 'Interaction tracked' });
  } catch (error) {
    console.error('Track interaction error:', error);
    res.status(500).json({ error: 'Failed to track interaction' });
  }
});

// Get analytics for a proposal
router.get('/proposals/:proposalId/analytics', async (req, res) => {
  try {
    const proposalId = parseInt(req.params.proposalId);

    // Fetch views and interactions data in parallel
    const [
      { data: views, count: totalViews },
      { data: interactions }
    ] = await Promise.all([
      supabase
        .from('proposal_views')
        .select('session_id, duration_seconds, viewed_at, device_type, browser', { count: 'exact' })
        .eq('proposal_id', proposalId),
      supabase
        .from('proposal_interactions')
        .select('*')
        .eq('proposal_id', proposalId)
        .in('interaction_type', ['click', 'hover', 'scroll'])
    ]);

    // Filter scroll interactions in memory
    const scrollInteractions = interactions?.filter(i => i.interaction_type === 'scroll') || [];
    const heatmapInteractions = interactions?.filter(i => i.interaction_type === 'click' || i.interaction_type === 'hover') || [];

    // Single-pass aggregation of view data
    const uniqueViews = new Set(views?.map(v => v.session_id)).size;
    const viewsOverTime: any = {};
    const deviceBreakdown: any = {};
    const browserBreakdown: any = {};
    let totalDuration = 0;
    let maxDuration = 0;

    views?.forEach(v => {
      // Duration stats
      const duration = v.duration_seconds || 0;
      totalDuration += duration;
      if (duration > maxDuration) maxDuration = duration;

      // Views over time
      const date = new Date(v.viewed_at).toISOString().split('T')[0];
      viewsOverTime[date] = (viewsOverTime[date] || 0) + 1;

      // Device breakdown
      const type = v.device_type || 'unknown';
      deviceBreakdown[type] = (deviceBreakdown[type] || 0) + 1;

      // Browser breakdown
      if (v.browser) {
        browserBreakdown[v.browser] = (browserBreakdown[v.browser] || 0) + 1;
      }
    });

    const avgDuration = (views && views.length > 0) ? totalDuration / views.length : 0;

    res.json({
      viewStats: {
        total_views: totalViews,
        unique_views: uniqueViews,
        avg_duration: avgDuration,
        max_duration: maxDuration,
      },
      viewsOverTime: Object.entries(viewsOverTime).map(([date, views]) => ({ date, views })),
      deviceBreakdown: Object.entries(deviceBreakdown).map(([device_type, count]) => ({ device_type, count })),
      browserBreakdown: Object.entries(browserBreakdown).map(([browser, count]) => ({ browser, count })),
      heatmapData: heatmapInteractions,
      scrollData: scrollInteractions,
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

// Get detailed view sessions
router.get('/proposals/:proposalId/sessions', async (req, res) => {
  try {
    const proposalId = parseInt(req.params.proposalId);

    const { data: sessions, error } = await supabase
      .from('proposal_views')
      .select(`
                *,
                interaction_count:proposal_interactions(count)
            `)
      .eq('proposal_id', proposalId)
      .order('viewed_at', { ascending: false });

    if (error) throw error;

    const formattedSessions = sessions.map(s => ({
      ...s,
      interaction_count: s.interaction_count?.[0]?.count || 0,
    }));

    res.json({ sessions: formattedSessions });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Failed to get sessions' });
  }
});

// Get session interactions (for session replay)
router.get('/sessions/:sessionId/interactions', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const { data: view } = await supabase
      .from('proposal_views')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (!view) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    const { data: interactions } = await supabase
      .from('proposal_interactions')
      .select('*')
      .eq('view_id', view.id)
      .order('timestamp', { ascending: true });

    res.json({
      view,
      interactions,
    });
  } catch (error) {
    console.error('Get session interactions error:', error);
    res.status(500).json({ error: 'Failed to get session interactions' });
  }
});

// Get pipeline analytics
router.get('/pipeline', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;

    // Fetch all proposals for the user
    const { data: proposals, error } = await supabase
      .from('proposals')
      .select('status, calculator_data')
      .eq('user_id', userId);

    if (error) {
      console.error('Supabase error fetching proposals:', error);
      throw error;
    }

    const pipelineStats = {
      totalPipelineValue: 0,
      breakdown: [
        { status: 'draft', value: 0, count: 0, label: 'Draft' },
        { status: 'sent', value: 0, count: 0, label: 'Sent' },
        { status: 'viewed', value: 0, count: 0, label: 'Viewed' },
        { status: 'accepted', value: 0, count: 0, label: 'Accepted' },
        { status: 'rejected', value: 0, count: 0, label: 'Rejected' }
      ]
    };

    // Use Map for O(1) lookups instead of O(n) findIndex
    const statusMap = new Map(
      pipelineStats.breakdown.map(b => [b.status, b])
    );

    proposals?.forEach(proposal => {
      // Extract annual total from calculator data
      // Note: Structure depends on calculator type, but both use 'totals.annualTotal' currently
      const annualTotal = proposal.calculator_data?.totals?.annualTotal || 0;
      const status = proposal.status || 'draft';

      pipelineStats.totalPipelineValue += annualTotal;

      const stat = statusMap.get(status);
      if (stat) {
        stat.value += annualTotal;
        stat.count += 1;
      }
    });

    res.json(pipelineStats);
  } catch (error) {
    console.error('Get pipeline analytics error:', {
      message: error instanceof Error ? error.message : String(error),
      details: error instanceof Error ? error.stack : String(error)
    });
    res.status(500).json({ error: 'Failed to get pipeline analytics' });
  }
});

export default router;
