import NDK, { NDKEvent } from "@nostr-dev-kit/ndk";
import { useEffect, useState } from "react";
import { sortBy } from "lodash";

type Comment = {
  videoId: string;
  time: number;
  content: string;
  created_at: number;
};

export default function App(): JSX.Element {
  const [comments, setComments] = useState<Comment[]>([]);
  const ndk = new NDK({
    explicitRelayUrls: [
      "wss://nostr-relay.app",
      "wss://relay.damus.io",
      "wss://relay.nostr.band",
      "wss://nos.lol",
      "wss://nostr.bitcoiner.social",
      "wss://relay.snort.social",
    ],
  });

  const convertToComment = (event: NDKEvent): Comment | undefined => {
    if (event.kind !== 2333) return;
    if (!event.created_at || event.created_at < 1713603600) return;
    const content = event.content.trim();
    if (!content) return;
    const [platform, videoId] =
      event.tags.find((tag) => tag[0] === "i")?.[1].split(":") ?? [];
    if (platform !== "youtube") return;
    if (!videoId) return;
    const time = Math.max(
      parseInt(event.tags.find((tag) => tag[0] === "time")?.[1] ?? "0") - 1,
      0
    );
    return {
      videoId,
      time,
      content,
      created_at: event.created_at,
    };
  };

  const init = async () => {
    await ndk.connect();
    const events = await ndk.fetchEvents({ kinds: [2333 as any], limit: 1000 });
    const comments: Comment[] = [];
    events.forEach((event) => {
      const comment = convertToComment(event);
      if (!comment) return;

      comments.push(comment);
    });
    setComments(sortBy(comments, (c) => -c.created_at));
  }

  useEffect(() => {
    init()
  }, []);

  return (
    <div className="p-4 space-y-4">
      <p>
        If you want to see danmaku comments from others or send danmaku comments
        on YouTube, you need to install the{" "}
        <a
          className="underline"
          href="https://chromewebstore.google.com/detail/danmakustr-decentralized/mohbdimkkpjjibdfipfajpgpmegnglhb"
          target="_blank"
        >
          danmakustr extension
        </a>{" "}
        first.
      </p>
      <p>
        Source code:{" "}
        <a
          className="underline"
          href="https://github.com/CodyTseng/danmakustr"
          target="_blank"
        >
          https://github.com/CodyTseng/danmakustr
        </a>
      </p>
      <p>Below are the recent danmaku comments sent by users. You can click to jump to the corresponding video:</p>
      <div className="flex flex-wrap">
        {comments.length
          ? comments.map((comment) => (
            <a
              href={`http://www.youtube.com/watch?v=${comment.videoId}&t=${comment.time}s`}
              target="_blank"
              className="flex p-1 m-1 underline items-center"
            >
              {comment.content}
              <div className="ml-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-square-arrow-out-up-right"><path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6" /><path d="m21 3-9 9" /><path d="M15 3h6v6" /></svg>
              </div>
            </a>
          ))
          : "Loading..."}
      </div>
    </div>
  );
}
