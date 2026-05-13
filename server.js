require('dotenv').config();

const express = require('express');
const axios = require('axios');
const cors = require('cors');

const { createClient } = require('@supabase/supabase-js');

const app = express();

app.use(cors());
app.use(express.json());

// ======================================================
// SUPABASE
// ======================================================

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ======================================================
// ROOT
// ======================================================

app.get('/', (req, res) => {

  res.send(
    'Neellohit backend running'
  );
});

// ======================================================
// SYNC TASKS FROM GOOGLE SHEETS
// ======================================================

app.get('/api/sync-tasks', async (req, res) => {

  try {

    // ============================================
    // FETCH FROM APPS SCRIPT
    // ============================================

    const response = await axios.get(
      `${process.env.GOOGLE_SCRIPT_URL}?action=getTasks`
    );

    const tasks =
      response.data.tasks || [];

    console.log(
      'RAW TASKS:',
      tasks
    );

    let synced = 0;

    // ============================================
    // LOOP TASKS
    // ============================================

    for (const task of tasks) {

      // ============================================
      // NORMALIZE VALUES
      // ============================================

      const taskCode =
        task.task_id ||
        task.taskId ||
        "";

      const subreddit =
        task.subreddit ||
        "";

      const postTitle =
        task.post_title ||
        task.postTitle ||
        task.title ||
        "";

      const postBody =
        task.post_body ||
        task.postBody ||
        "";

      const commentBody =
        task.comment_body ||
        task.commentBody ||
        "";

      const reward =
        Number(task.reward) || 0;

      const timeLimit =
        Number(task.time_limit) ||
        Number(task.timeLimit) ||
        30;

      // ============================================
      // FINAL TITLE
      // ============================================

      const finalTitle =

        postTitle ||

        commentBody?.slice(0, 80) ||

        subreddit ||

        taskCode ||

        "Reddit Task";

      // ============================================
      // PAYLOAD
      // ============================================

      const payload = {

        // BASIC
        title:
          finalTitle,

        description:
          postBody ||
          commentBody ||
          "",

        platform:
          "reddit",

        // TASK META
        reward:
          reward,

        status:
          "draft",

        draft:
          true,

        source:
          "sheet",

                // TASK DETAILS
        task_type:
          task.task_type ||
          task.taskType ||
          "post",

        subreddit:
          subreddit,

        flair:
          task.flair || "",

        body:
          postBody,

        image_link:
          task.image_link ||
          task.imageLink ||
          "",

        post_link:
          task.post_link ||
          task.postLink ||
          "",

        comment_type:
          task.comment_type ||
          task.commentType ||
          "",

        time_limit:
          timeLimit,

        // IMPORTANT
        task_code:
          taskCode
      };

      console.log(
        'PAYLOAD:',
        payload
      );

      // ============================================
      // UPSERT
      // ============================================

      const { error } =
        await supabase
          .from('tasks')
          .upsert(
            payload,
            {
              onConflict:
                'task_code'
            }
          );

      if (error) {

        console.error(
          'SUPABASE ERROR:',
          error.message
        );

      } else {

        synced++;
      }
    }

    // ============================================
    // RESPONSE
    // ============================================

    return res.json({
      success: true,
      synced,
      total: tasks.length
    });

  } catch (err) {

    console.error(
      'SYNC ERROR:',
      err.message
    );

    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ======================================================
// GET TASKS
// ======================================================

app.get('/api/tasks', async (req, res) => {

  try {

    const {
      data,
      error
    } = await supabase
      .from('tasks')
      .select('*')
      .order(
        'created_at',
        {
          ascending: false
        }
      );

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      tasks: data
    });

  } catch (err) {

    console.error(
      'FETCH TASKS ERROR:',
      err.message
    );

    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ======================================================
// START SERVER
// ======================================================

const PORT = 5000;

app.listen(PORT, () => {

  console.log(
    `Server running on port ${PORT}`
  );
});