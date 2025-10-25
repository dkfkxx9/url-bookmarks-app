import { useState, useEffect } from "react";
import { Link2, Plus, Trash2, FolderPlus, Clipboard, Pencil, Check, X, ArrowUpDown, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  query,
  orderBy,
  Timestamp,
  updateDoc
} from "firebase/firestore";

type Bookmark = {
  id: string;
  url: string;
  title: string;
  folder: string;
  tags: string[];
  memo?: string;
  isChecked: boolean;
  createdAt: Date;
};

const DEFAULT_FOLDERS = ["대학원", "업무", "KBS", "기타"];
const DEFAULT_TAGS = ["유튜브", "페이스북", "인스타그램", "뉴스", "메모", "드라이브", "기타"];

type SortOption = "newest" | "oldest" | "alphabetical";

const Index = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [folders, setFolders] = useState<string[]>(DEFAULT_FOLDERS);
  const [selectedFolder, setSelectedFolder] = useState<string>(DEFAULT_FOLDERS[0]);
  const [selectedTags, setSelectedTags] = useState<string[]>([DEFAULT_TAGS[0]]);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [pastedUrl, setPastedUrl] = useState("");
  const [memo, setMemo] = useState("");
  const [editingBookmarkId, setEditingBookmarkId] = useState<string | null>(null);
  const [editingFolder, setEditingFolder] = useState<string>("");
  const [editingTags, setEditingTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);

  // Firestore 리스너 설정
  useEffect(() => {
    const q = query(collection(db, "bookmarks"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedBookmarks: Bookmark[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          url: data.url,
          title: data.title || data.url,
          folder: data.folder,
          tags: data.tags || (data.tag ? [data.tag] : []), // 기존 tag 필드 호환성
          memo: data.memo,
          isChecked: data.isChecked || false,
          createdAt: data.createdAt?.toDate() || new Date(),
        };
      });
      setBookmarks(loadedBookmarks);
    });

    return () => unsubscribe();
  }, []);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setPastedUrl(text);
      toast.success("URL이 붙여넣기되었습니다!");
    } catch (error) {
      toast.error("붙여넣기 실패. 권한을 확인해주세요.");
    }
  };

  const addBookmark = async () => {
    if (!pastedUrl.trim()) {
      toast.error("URL을 붙여넣어주세요");
      return;
    }

    try {
      // URL에서 제목 추출 시도
      let title = pastedUrl;
      try {
        const url = new URL(pastedUrl);
        title = url.hostname + url.pathname;
      } catch {
        // URL 파싱 실패시 그냥 URL 사용
      }

      await addDoc(collection(db, "bookmarks"), {
        url: pastedUrl,
        title: title,
        folder: selectedFolder,
        tags: selectedTags.length > 0 ? selectedTags : [DEFAULT_TAGS[0]],
        memo: memo.trim() || undefined,
        isChecked: false,
        createdAt: Timestamp.now(),
      });

      setPastedUrl("");
      setMemo("");
      setSelectedTags([DEFAULT_TAGS[0]]); // 태그 초기화
      toast.success(`${selectedFolder} 폴더에 저장되었습니다!`);
    } catch (error) {
      console.error("Error adding bookmark:", error);
      toast.error("북마크 추가에 실패했습니다");
    }
  };

  const deleteBookmark = async (id: string) => {
    try {
      await deleteDoc(doc(db, "bookmarks", id));
      toast.success("북마크가 삭제되었습니다");
    } catch (error) {
      console.error("Error deleting bookmark:", error);
      toast.error("북마크 삭제에 실패했습니다");
    }
  };

  const addNewFolder = () => {
    if (!newFolderName.trim()) {
      toast.error("폴더명을 입력해주세요");
      return;
    }

    if (folders.includes(newFolderName)) {
      toast.error("이미 존재하는 폴더명입니다");
      return;
    }

    setFolders([...folders, newFolderName]);
    setSelectedFolder(newFolderName);
    setNewFolderName("");
    setShowNewFolderInput(false);
    toast.success("새 폴더가 추가되었습니다!");
  };

  const startEditing = (bookmark: Bookmark) => {
    setEditingBookmarkId(bookmark.id);
    setEditingFolder(bookmark.folder);
    setEditingTags(bookmark.tags || []);
  };

  const saveEdit = async () => {
    if (!editingBookmarkId) return;

    try {
      await updateDoc(doc(db, "bookmarks", editingBookmarkId), {
        folder: editingFolder,
        tags: editingTags,
      });
      setEditingBookmarkId(null);
      setEditingFolder("");
      setEditingTags([]);
      toast.success("북마크가 수정되었습니다!");
    } catch (error) {
      console.error("Error updating bookmark:", error);
      toast.error("북마크 수정에 실패했습니다");
    }
  };

  const cancelEdit = () => {
    setEditingBookmarkId(null);
    setEditingFolder("");
    setEditingTags([]);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const toggleEditingTag = (tag: string) => {
    setEditingTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const toggleFilterTag = (tag: string) => {
    setFilterTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const toggleChecked = async (bookmarkId: string, currentChecked: boolean) => {
    try {
      await updateDoc(doc(db, "bookmarks", bookmarkId), {
        isChecked: !currentChecked,
      });
      toast.success(currentChecked ? "미확인으로 표시했습니다" : "확인으로 표시했습니다");
    } catch (error) {
      console.error("Error toggling checked:", error);
      toast.error("상태 변경에 실패했습니다");
    }
  };

  const deleteFolder = async (folder: string, moveToFolder?: string) => {
    try {
      const bookmarksInFolder = bookmarks.filter(b => b.folder === folder);

      if (moveToFolder) {
        // 북마크들을 다른 폴더로 이동
        for (const bookmark of bookmarksInFolder) {
          await updateDoc(doc(db, "bookmarks", bookmark.id), {
            folder: moveToFolder,
          });
        }
      } else {
        // 북마크들도 함께 삭제
        for (const bookmark of bookmarksInFolder) {
          await deleteDoc(doc(db, "bookmarks", bookmark.id));
        }
      }

      setFolders(prev => prev.filter(f => f !== folder));
      setFolderToDelete(null);
      toast.success("폴더가 삭제되었습니다");
    } catch (error) {
      console.error("Error deleting folder:", error);
      toast.error("폴더 삭제에 실패했습니다");
    }
  };

  const getBookmarksByFolder = (folder: string) => {
    let filtered = bookmarks.filter((bookmark) => bookmark.folder === folder);

    // Filter by tags if any are selected
    if (filterTags.length > 0) {
      filtered = filtered.filter(bookmark =>
        filterTags.some(tag => bookmark.tags.includes(tag))
      );
    }

    // Sort based on selected option
    switch (sortBy) {
      case "newest":
        return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      case "oldest":
        return filtered.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      case "alphabetical":
        return filtered.sort((a, b) => (a.memo || '').localeCompare(b.memo || '', 'ko'));
      default:
        return filtered;
    }
  };

  return (
    <main className="min-h-screen bg-blue-dark py-8 px-4 relative overflow-hidden">
      {/* Decorative background elements - Blue tone */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="mx-auto max-w-4xl relative z-10">
        {/* Header */}
        <header className="mb-8 text-center animate-fade-in">
          <div className="mb-4 inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-blue-glass shadow-blue backdrop-blur-md border border-blue-400/30">
            <Link2 className="w-10 h-10 text-blue-200" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-3">
            보노보노 언제보노
          </h1>
          <p className="text-blue-100/70 text-lg">
            링크를 저장하고 나중에 확인하세요 🔖
          </p>
        </header>

        {/* URL Input Section */}
        <section className="mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <div className="glass-blue rounded-3xl shadow-blue p-5 transition-all duration-300 hover:shadow-blue-hover backdrop-blur-xl border border-blue-400/20">
            <div className="flex flex-col gap-3">
              {/* URL Input with Paste and Add buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handlePaste}
                  variant="outline"
                  className="glass-blue border-blue-400/30 hover:bg-blue-500/20 text-blue-100 h-12 px-4 flex-shrink-0"
                >
                  <Clipboard className="w-4 h-4 mr-1.5" />
                  붙여넣기
                </Button>
                <Input
                  value={pastedUrl}
                  onChange={(e) => setPastedUrl(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && addBookmark()}
                  placeholder="URL을 입력하거나 붙여넣으세요..."
                  className="flex-1 glass-blue border-blue-400/30 focus-visible:ring-blue-400 focus-visible:border-blue-400/50 text-blue-50 placeholder:text-blue-200/40 h-12 backdrop-blur-sm"
                />
                <Button
                  onClick={addBookmark}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 transition-all shadow-blue hover:shadow-blue-hover hover:scale-105 h-12 px-8 font-bold text-white flex-shrink-0"
                >
                  <Plus className="w-5 h-5 mr-1.5" />
                  추가
                </Button>
              </div>

              {/* Memo Input */}
              <Input
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && addBookmark()}
                placeholder="메모 (선택사항)"
                className="glass-blue border-blue-400/30 focus-visible:ring-blue-400 focus-visible:border-blue-400/50 text-blue-50 placeholder:text-blue-200/40 h-10 backdrop-blur-sm"
              />

              {/* Tag Selection */}
              <div>
                <div className="text-xs text-blue-300/80 mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  태그 (중복 선택 가능)
                </div>
                <div className="flex gap-2 flex-wrap">
                  {DEFAULT_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all font-medium ${
                        selectedTags.includes(tag)
                          ? "bg-gradient-to-r from-blue-500/50 to-cyan-500/50 text-blue-50 shadow-blue border border-blue-400/60 backdrop-blur-md scale-105"
                          : "glass-blue text-blue-200/80 hover:text-blue-100 hover:bg-blue-500/20 border border-blue-400/20"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Folder Selection */}
              <div>
                <div className="text-xs text-blue-300/80 mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  폴더
                </div>
                <div className="flex gap-2 flex-wrap">
                  {folders.map((folder) => (
                    <button
                      key={folder}
                      onClick={() => setSelectedFolder(folder)}
                      className={`px-4 py-2 rounded-full transition-all font-medium ${
                        selectedFolder === folder
                          ? "bg-blue-500/40 text-blue-50 shadow-blue border border-blue-400/50 backdrop-blur-md"
                          : "glass-blue text-blue-200 hover:bg-blue-500/20 border border-blue-400/20"
                      }`}
                    >
                      {folder}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowNewFolderInput(!showNewFolderInput)}
                    className="px-4 py-2 rounded-full glass-blue text-blue-200 hover:bg-blue-500/20 border border-blue-400/20 transition-all"
                  >
                    <FolderPlus className="w-4 h-4 inline mr-1" />
                    새 폴더
                  </button>
                </div>

                {/* New Folder Input */}
                {showNewFolderInput && (
                  <div className="flex gap-2 animate-fade-in mt-2">
                    <Input
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addNewFolder()}
                      placeholder="폴더명 입력..."
                      className="flex-1 glass-blue border-blue-400/30 focus-visible:ring-blue-400 text-blue-50 placeholder:text-blue-200/40 h-10 backdrop-blur-sm"
                    />
                    <Button
                      onClick={addNewFolder}
                      size="sm"
                      className="bg-blue-500/40 hover:bg-blue-500/60 text-blue-50 border border-blue-400/30 h-10"
                    >
                      추가
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Tag Filter */}
        {bookmarks.length > 0 && (
          <section className="mb-4 animate-fade-in">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-sm text-blue-200/80">태그 필터:</span>
              {DEFAULT_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleFilterTag(tag)}
                  className={`px-2.5 py-1 rounded-full text-xs transition-all font-medium ${
                    filterTags.includes(tag)
                      ? "bg-gradient-to-r from-cyan-500/50 to-blue-500/50 text-cyan-50 shadow-blue border border-cyan-400/60"
                      : "text-blue-300/60 hover:text-blue-200 hover:bg-blue-500/10 border border-blue-400/20"
                  }`}
                >
                  {tag}
                </button>
              ))}
              {filterTags.length > 0 && (
                <button
                  onClick={() => setFilterTags([])}
                  className="px-2.5 py-1 rounded-full text-xs text-red-300/80 hover:text-red-200 hover:bg-red-500/10 border border-red-400/20"
                >
                  필터 초기화
                </button>
              )}
            </div>
          </section>
        )}

        {/* Sort Options */}
        {bookmarks.length > 0 && (
          <section className="mb-6 animate-fade-in">
            <div className="flex items-center justify-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-blue-300" />
              <span className="text-sm text-blue-200/80">정렬:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSortBy("newest")}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    sortBy === "newest"
                      ? "bg-blue-500/40 text-blue-50 border border-blue-400/50"
                      : "text-blue-300/70 hover:text-blue-200 hover:bg-blue-500/10"
                  }`}
                >
                  최신순
                </button>
                <button
                  onClick={() => setSortBy("oldest")}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    sortBy === "oldest"
                      ? "bg-blue-500/40 text-blue-50 border border-blue-400/50"
                      : "text-blue-300/70 hover:text-blue-200 hover:bg-blue-500/10"
                  }`}
                >
                  오래된순
                </button>
                <button
                  onClick={() => setSortBy("alphabetical")}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    sortBy === "alphabetical"
                      ? "bg-blue-500/40 text-blue-50 border border-blue-400/50"
                      : "text-blue-300/70 hover:text-blue-200 hover:bg-blue-500/10"
                  }`}
                >
                  가나다순
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Bookmarks by Folder */}
        <section className="space-y-6">
          {folders.map((folder, folderIndex) => {
            const folderBookmarks = getBookmarksByFolder(folder);
            if (folderBookmarks.length === 0) return null;

            return (
              <div
                key={folder}
                className="animate-fade-in"
                style={{ animationDelay: `${folderIndex * 0.1}s` }}
              >
                <h2 className="text-2xl font-bold text-blue-100 mb-3 flex items-center gap-2 group/folder">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  {folder}
                  <span className="text-sm font-normal text-blue-300/60">
                    ({folderBookmarks.length})
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setFolderToDelete(folder)}
                    className="opacity-0 group-hover/folder:opacity-100 transition-all text-red-400/70 hover:text-red-300 hover:bg-red-500/10 h-6 w-6 ml-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </h2>
                <div className="space-y-2">
                  {folderBookmarks.map((bookmark, index) => (
                    <div
                      key={bookmark.id}
                      className="glass-blue rounded-2xl shadow-blue p-4 transition-all duration-300 hover:shadow-blue-hover hover:bg-blue-500/10 animate-slide-in group border border-blue-400/20 backdrop-blur-xl"
                      style={{ animationDelay: `${index * 0.03}s` }}
                    >
                      <div className="flex items-start gap-3">
                        <Link2 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <a
                            href={bookmark.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-100 hover:text-blue-200 transition-colors font-medium block truncate"
                          >
                            {bookmark.title}
                          </a>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-blue-300/60 truncate flex-1 min-w-0">
                              {bookmark.url}
                            </span>
                            {bookmark.tags && bookmark.tags.length > 0 && (
                              <div className="flex gap-1 flex-shrink-0 flex-wrap">
                                {bookmark.tags.map((tag) => (
                                  <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-500/30 to-cyan-500/30 text-blue-200 border border-blue-400/30">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          {bookmark.memo && (
                            <div className="mt-2 text-sm text-blue-200/80 bg-blue-500/10 rounded-lg px-3 py-2 border border-blue-400/20">
                              {bookmark.memo}
                            </div>
                          )}

                          {/* Edit Mode */}
                          {editingBookmarkId === bookmark.id && (
                            <div className="mt-3 space-y-3">
                              {/* Folder Selection */}
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-blue-300">폴더:</span>
                                <select
                                  value={editingFolder}
                                  onChange={(e) => setEditingFolder(e.target.value)}
                                  className="flex-1 px-2 py-1.5 rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                >
                                  {folders.map((f) => (
                                    <option key={f} value={f} className="bg-blue-900">
                                      {f}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Tag Selection */}
                              <div>
                                <div className="text-xs text-blue-300 mb-2">태그 (중복 선택 가능):</div>
                                <div className="flex gap-1.5 flex-wrap">
                                  {DEFAULT_TAGS.map((tag) => (
                                    <button
                                      key={tag}
                                      onClick={() => toggleEditingTag(tag)}
                                      className={`px-2 py-1 rounded-full text-xs transition-all font-medium ${
                                        editingTags.includes(tag)
                                          ? "bg-gradient-to-r from-blue-500/50 to-cyan-500/50 text-blue-50 shadow-blue border border-blue-400/60"
                                          : "glass-blue text-blue-200/80 hover:text-blue-100 hover:bg-blue-500/20 border border-blue-400/20"
                                      }`}
                                    >
                                      {tag}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Save/Cancel Buttons */}
                              <div className="flex gap-2">
                                <Button
                                  onClick={saveEdit}
                                  className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-400/30"
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  저장
                                </Button>
                                <Button
                                  onClick={cancelEdit}
                                  className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-400/30"
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  취소
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        {editingBookmarkId !== bookmark.id && (
                          <div className="flex gap-1 flex-shrink-0">
                            {/* Check status button - always visible */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleChecked(bookmark.id, bookmark.isChecked)}
                              className={`h-8 w-8 transition-all ${
                                bookmark.isChecked
                                  ? "text-green-400 hover:text-green-300 bg-green-500/10 hover:bg-green-500/20"
                                  : "text-yellow-400 hover:text-yellow-300 bg-yellow-500/10 hover:bg-yellow-500/20"
                              }`}
                              title={bookmark.isChecked ? "확인함" : "미확인"}
                            >
                              {bookmark.isChecked ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </Button>
                            {/* Edit/Delete buttons - show on hover */}
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => startEditing(bookmark)}
                                className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 h-8 w-8"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteBookmark(bookmark.id)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        {/* Empty State */}
        {bookmarks.length === 0 && (
          <div className="glass-blue rounded-3xl shadow-blue p-16 text-center animate-fade-in backdrop-blur-xl border border-blue-400/20">
            <div className="mb-4 inline-flex items-center justify-center w-20 h-20 rounded-full glass-blue border border-blue-400/30">
              <Link2 className="w-10 h-10 text-blue-400" />
            </div>
            <p className="text-blue-100/70 text-lg">
              첫 번째 북마크를 추가해보세요 🔗
            </p>
          </div>
        )}

        {/* Footer Stats */}
        {bookmarks.length > 0 && (
          <footer className="mt-8 text-center text-sm text-blue-200/60 animate-fade-in">
            총 {bookmarks.length}개 북마크 • {folders.length}개 폴더 ✨
          </footer>
        )}

        {/* Folder Delete Modal */}
        {folderToDelete && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setFolderToDelete(null)}>
            <div className="glass-blue rounded-3xl shadow-blue p-6 max-w-md w-full border border-blue-400/30 backdrop-blur-xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-blue-100 mb-4">폴더 삭제 확인</h3>
              <p className="text-blue-200/80 mb-2">
                '<span className="font-semibold text-blue-100">{folderToDelete}</span>' 폴더를 삭제하시겠습니까?
              </p>
              <p className="text-sm text-blue-300/70 mb-6">
                이 폴더에는 {bookmarks.filter(b => b.folder === folderToDelete).length}개의 북마크가 있습니다.
              </p>

              <div className="space-y-3">
                {/* Move to another folder */}
                {folders.filter(f => f !== folderToDelete).length > 0 && (
                  <div>
                    <p className="text-sm text-blue-200 mb-2">북마크를 다른 폴더로 이동:</p>
                    <div className="flex gap-2 flex-wrap">
                      {folders.filter(f => f !== folderToDelete).map((targetFolder) => (
                        <Button
                          key={targetFolder}
                          onClick={() => deleteFolder(folderToDelete, targetFolder)}
                          className="glass-blue border-blue-400/30 hover:bg-blue-500/30 text-blue-100 text-sm"
                        >
                          {targetFolder}로 이동
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Delete folder and bookmarks */}
                <div className="pt-3 border-t border-blue-400/20">
                  <Button
                    onClick={() => deleteFolder(folderToDelete)}
                    className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-400/30"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    폴더와 북마크 모두 삭제
                  </Button>
                </div>

                {/* Cancel */}
                <Button
                  onClick={() => setFolderToDelete(null)}
                  variant="outline"
                  className="w-full glass-blue border-blue-400/30 hover:bg-blue-500/20 text-blue-100"
                >
                  취소
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default Index;
