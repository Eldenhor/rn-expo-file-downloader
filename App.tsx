import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as FileSystem from "expo-file-system";
import { DownloadProgressData } from "expo-file-system";

export default function App() {
  const [selectedUri, setSelectedUri] = useState<string | null>(null);
  const [status, setStatus] = useState<string[]>([]);
  const [progress, setProgress] = useState<number | null>(null);

  const scrollViewRef = useRef<ScrollView | null>(null);

  const updateStatus = (message: string) => {
    setStatus(prevState => [...prevState, message]);
  };

  useEffect(() => {
    if (scrollViewRef.current !== null) {
      scrollViewRef.current.scrollToEnd({animated: true});
    }
  }, [status]);

  const filesIds = ["x8/wallhaven-x8e5e3", "e7/wallhaven-e78z9l", "k7/wallhaven-k7838q", "q2/wallhaven-q2r9rq"];

  const fileDir = FileSystem.cacheDirectory + "downloadedFiles/";
  const fileUri = (fileId: string) => fileDir + `file_${fileId.replace("/", "")}`;
  const fileUrl = (fileId: string) => `https://w.wallhaven.cc/full/${fileId}.jpg`;

  const ensureDirExist = async () => {
    const dirInfo = await FileSystem.getInfoAsync(fileDir);
    if (!dirInfo.exists) {
      console.log("Downloaded file directory doesn't exist, creating...");
      updateStatus("Downloaded file directory doesn't exist, creating...");
      await FileSystem.makeDirectoryAsync(fileDir, {intermediates: true});
    }
  };

  const callback = async (downloadProgress: DownloadProgressData) => {
    const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
    setProgress(progress);
  };

  const getFile = async (fileId: string) => {
    await ensureDirExist();

    const currentFileUri = fileUri(fileId);
    const fileInfo = await FileSystem.getInfoAsync(currentFileUri);


    if (!fileInfo.exists) {
      console.log("File isn't cached locally. Downloading...");
      updateStatus(`Files ${fileId} isn't cached locally. Downloading...`);
      const downloadResumable = FileSystem.createDownloadResumable(
        fileUrl(fileId), currentFileUri, {}, callback
      );
      await downloadResumable.downloadAsync();
      setProgress(null);
    }

    console.log(`File ${fileId} cached locally.`);
    updateStatus(`File ${fileId} cached locally`);
    return currentFileUri;
  };

  const handleFileSelect = async (id: string) => {
    try {
      setSelectedUri(await getFile(id));
      updateStatus(`current id: ${id}`);
    } catch (e) {
      console.error("Couldn't load file", e);
      updateStatus("Couldn't load file");
    }
  };

  const deleteAllFiles = async () => {
    console.log("Deleting all downloaded files...");
    updateStatus("Deleting all downloaded files...");
    setSelectedUri(null);
    await FileSystem.deleteAsync(fileDir);
  };

  let idx = 0;

  return (
    <View style={styles.container}>
      <StatusBar style="light"/>
      <View style={styles.image}>
        {selectedUri !== null ? <Image source={{uri: selectedUri}} style={styles.image}/> :
          <Text style={styles.noImage}>No image</Text>}
      </View>
      <View style={styles.buttonsContainer}>
        {
          filesIds.map((item, index) => (
              <TouchableOpacity
                style={styles.button}
                key={item}
                onPress={() => handleFileSelect(item)}><Text>{index + 1}</Text></TouchableOpacity>
            )
          )
        }
      </View>
      <View style={styles.downloadBarWrapperBorder}>
        <View style={styles.downloadBarWrapper}>
          {
            progress && <View style={{width: progress * 200, height: 20, backgroundColor: "#fff"}}/>
          }
        </View>
      </View>
      <View style={styles.deleteButtonWrapper}>
        <TouchableOpacity onPress={deleteAllFiles} style={styles.button}><Text>Delete Files</Text></TouchableOpacity>
      </View>
      <View style={styles.scrollViewWrapper}>
        <ScrollView ref={scrollViewRef} style={styles.logWrapper}>
          {
            status.map((item: string) => {
              return <Text key={++idx} style={styles.logText}>{item}</Text>;
            })
          }
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 80,
    flex: 1,
    backgroundColor: "#343434",
    justifyContent: "space-between",
  },
  button: {
    minWidth: 60,
    height: 60,
    borderWidth: 1,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D6D6D6"
  },
  deleteButtonWrapper: {
    paddingHorizontal: 50
  }
  ,
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 40
  },
  pressed: {
    backgroundColor: "lightblue",
  },
  unpressed: {
    backgroundColor: "lightpink",
  },
  logWrapper: {
    borderTopWidth: 2,
    borderTopColor: "#585858",
    backgroundColor: "#6A6A6A",
    paddingHorizontal: 8,
  },
  logText: {
    color: "#50DDFF"
  },
  scrollViewWrapper: {
    height: 200,
    alignSelf: "stretch"
  },
  image: {
    height: 300,
    width: 300,
    alignSelf: "center",
    borderWidth: 2,
    borderColor: "#76B4C2",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center"
  },
  noImage: {
    color: "#fff",
    fontSize: 24
  },
  downloadBarWrapper: {
    height: 23,
    left: "50%",
    transform: [
      {translateX: -100}
    ],
  },
  downloadBarWrapperBorder: {
    borderWidth: 2,
    borderColor: "#fff",
    padding: 2,
    height: 28,
    alignSelf: "center",
    width: 208
  }
});
