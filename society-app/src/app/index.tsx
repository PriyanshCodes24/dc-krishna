import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  StyleSheet,
  Alert,
  SafeAreaView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { useVideoPlayer, VideoView } from "expo-video";
import { uploadToCloudinary } from "../services/cloudinary";

const API_URL = "http://192.168.1.9:5000/api/posts";

interface MediaItem {
  url: string;
  publicId: string;
  resourceType: "image" | "video";
}

interface Post {
  _id: string;
  authorName: string;
  flatNo: string;
  caption: string;
  media: MediaItem[];
  createdAt: string;
}

// Separate Video Card component so each video gets its own player instance
function PostVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
  });

  return (
    <VideoView
      style={styles.media}
      player={player}
      allowsFullscreen
      allowsPictureInPicture
    />
  );
}

export default function SocietyFeedScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [caption, setCaption] = useState("");
  const [selectedAsset, setSelectedAsset] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchPosts = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsEditing: true,
      quality: 0.8,
      videoMaxDuration: 60, // Keep society videos under 60s to save storage
    });

    if (!result.canceled) {
      setSelectedAsset(result.assets[0]);
    }
  };

  const handleCreatePost = async () => {
    if (!caption.trim() && !selectedAsset) {
      Alert.alert("Empty post", "Add a message or select a photo/video.");
      return;
    }

    setUploading(true);
    try {
      let mediaList: MediaItem[] = [];

      if (selectedAsset) {
        let uploadUri = selectedAsset.uri;
        const isVideo = selectedAsset.type === "video";
        const mimeType =
          selectedAsset.mimeType || (isVideo ? "video/mp4" : "image/jpeg");

        // Compress images before upload
        if (!isVideo) {
          const manipulated = await ImageManipulator.manipulateAsync(
            selectedAsset.uri,
            [{ resize: { width: 1400 } }],
            { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
          );
          uploadUri = manipulated.uri;
        }

        const uploaded = await uploadToCloudinary(uploadUri, mimeType);
        mediaList.push(uploaded as MediaItem);
      }

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: "Priyansh Patel", // Will come from JWT user state next
          flatNo: "A-101",
          category: "event",
          caption: caption.trim() || "Shared a moment",
          media: mediaList,
        }),
      });

      if (!res.ok) throw new Error("Failed to save post");

      setCaption("");
      setSelectedAsset(null);
      fetchPosts();
    } catch (err: any) {
      Alert.alert("Upload Error", err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Society Feed</Text>

      {/* Composer Box */}
      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          placeholder="Share an update, event photo, or video..."
          value={caption}
          onChangeText={setCaption}
          multiline
        />

        {selectedAsset && (
          <Text style={styles.attachmentTag}>
            Attached: {selectedAsset.type?.toUpperCase()}
          </Text>
        )}

        <View style={styles.row}>
          <TouchableOpacity style={styles.pickBtn} onPress={pickMedia}>
            <Text style={styles.pickBtnText}>+ Photo / Video</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.postBtn, uploading && { opacity: 0.6 }]}
            onPress={handleCreatePost}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.postBtnText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Posts Feed */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.author}>
              {item.authorName} • Flat {item.flatNo}
            </Text>
            <Text style={styles.caption}>{item.caption}</Text>

            {item.media?.map((m, idx) =>
              m.resourceType === "video" ? (
                <PostVideo key={idx} uri={m.url} />
              ) : (
                <Image
                  key={idx}
                  source={{ uri: m.url }}
                  style={styles.media}
                  resizeMode="cover"
                />
              ),
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6", paddingHorizontal: 14 },
  header: {
    fontSize: 24,
    fontWeight: "700",
    marginVertical: 12,
    color: "#111",
  },
  composer: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  input: { minHeight: 50, fontSize: 15, color: "#111", marginBottom: 8 },
  attachmentTag: { color: "#2563eb", fontSize: 13, marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  pickBtn: {
    backgroundColor: "#e5e7eb",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  pickBtnText: { fontWeight: "600", color: "#1f2937" },
  postBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 8,
  },
  postBtnText: { fontWeight: "600", color: "#fff" },
  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  author: {
    fontWeight: "700",
    fontSize: 14,
    color: "#374151",
    marginBottom: 4,
  },
  caption: { fontSize: 15, color: "#111827", marginBottom: 10 },
  media: {
    width: "100%",
    height: 240,
    borderRadius: 10,
    backgroundColor: "#000",
  },
});
