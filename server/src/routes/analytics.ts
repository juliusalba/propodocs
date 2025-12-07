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

    // Supabase doesn't support complex aggregations in one go easily via JS client
    // We'll do separate queries or use RPCs in a real production app
    // For now, we'll fetch data and aggregate in JS or use simple counts

    // Total Views
    const { count: totalViews } = await supabase
      .from('proposal_views')
      .select('*', { count: 'exact', head: true })
      .eq('proposal_id', proposalId);

    // Unique Views (approximate via JS for now, or use RPC)
    const { data: views } = await supabase
      .from('proposal_views')
      .select('session_id, duration_seconds, viewed_at, device_type, browser')
      .eq('proposal_id', proposalId);

    const uniqueViews = new Set(views?.map(v => v.session_id)).size;
    const avgDuration = (views && views.length > 0) ? views.reduce((acc, v) => acc + (v.duration_seconds || 0), 0) / views.length : 0;
    const maxDuration = Math.max(...(views?.map(v => v.duration_seconds || 0) || [0]));

    // Views Over Time
    const viewsOverTime = views?.reduce((acc: any, v) => {
      const date = new Date(v.viewed_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    // Device Breakdown
    const deviceBreakdown = views?.reduce((acc: any, v) => {
      const type = v.device_type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // Browser Breakdown
    const browserBreakdown = views?.reduce((acc: any, v) => {
      if (v.browser) {
        acc[v.browser] = (acc[v.browser] || 0) + 1;
      }
      return acc;
    }, {});

    // Heatmap Data
    const { data: interactions } = await supabase
      .from('proposal_interactions')
      .select('*')
      .eq('proposal_id', proposalId)
      .in('interaction_type', ['click', 'hover']);

    // Scroll Data
    const { data: scrollInteractions } = await supabase
      .from('proposal_interactions')
      .select('scroll_depth')
      .eq('proposal_id', proposalId)
      .eq('interaction_type', 'scroll');

    res.json({
      viewStats: {
        total_views: totalViews,
        unique_views: uniqueViews,
        avg_duration: avgDuration,
        max_duration: maxDuration,
      },
      viewsOverTime: Object.entries(viewsOverTime || {}).map(([date, views]) => ({ date, views })),
      deviceBreakdown: Object.entries(deviceBreakdown || {}).map(([device_type, count]) => ({ device_type, count })),
      browserBreakdown: Object.entries(browserBreakdown || {}).map(([browser, count]) => ({ browser, count })),
      heatmapData: interactions, // Sending raw data for now, frontend can aggregate
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

    // Fetch all active proposals (not trashed)
    const { data: proposals, error } = await supabase
      .from('proposals')
      .select('status, calculator_data')
      .eq('user_id', userId)
      .not('theme', 'cs', '{"isArchived": true}');

    if (error) throw error;

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

    proposals?.forEach(proposal => {
      // Extract annual total from calculator data
      // Note: Structure depends on calculator type, but both use 'totals.annualTotal' currently
      const annualTotal = proposal.calculator_data?.totals?.annualTotal || 0;
      const status = proposal.status || 'draft';

      pipelineStats.totalPipelineValue += annualTotal;

      const statIndex = pipelineStats.breakdown.findIndex(s => s.status === status);
      if (statIndex !== -1) {
        pipelineStats.breakdown[statIndex].value += annualTotal;
        pipelineStats.breakdown[statIndex].count += 1;
      }
    });

    res.json(pipelineStats);
  } catch (error) {
    console.error('Get pipeline analytics error:', error);
    res.status(500).json({ error: 'Failed to get pipeline analytics' });
  }
});

export default router;
