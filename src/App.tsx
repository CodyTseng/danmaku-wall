import NDK from "@nostr-dev-kit/ndk";
import { useEffect, useState } from "react";

type Comment = {
  videoId: string;
  time: number;
  content: string;
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

  useEffect(() => {
    ndk.connect().then(() => {
      ndk
        .fetchEvents({ kinds: [2333 as any], limit: 1000, since: 1713603600 })
        .then((events) => {
          const comments: Comment[] = [];
          events.forEach((event) => {
            if (event.kind !== 2333) return;
            const content = event.content.trim();
            if (!content) return;
            const [platform, videoId] =
              event.tags.find((tag) => tag[0] === "i")?.[1].split(":") ?? [];
            if (platform !== "youtube") return;
            if (!videoId) return;
            const time = Math.max(
              parseInt(
                event.tags.find((tag) => tag[0] === "time")?.[1] ?? "0"
              ) - 1,
              0
            );

            comments.push({
              videoId,
              time,
              content,
            });
          });
          setComments(comments);
        });
    });
  }, []);

  return (
    <div className="p-4 flex flex-wrap">
      {comments.map((comment) => (
        <div className="flex p-1 m-1 border rounded-md">
          <a
            href={`http://www.youtube.com/watch?v=${comment.videoId}&t=${comment.time}s`}
            target="_blank"
          >
            {comment.content}
          </a>
        </div>
      ))}
    </div>
  );
}
