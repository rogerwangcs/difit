import {
  ChevronRight,
  ChevronDown,
  FileDiff,
  FolderOpen,
  Folder,
  FilePlus,
  FileX,
  FilePen,
  Search,
  MessageSquare,
  ChevronsDownUp,
  ChevronsUpDown,
} from 'lucide-react';
import { memo, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from 'react';

import { type DiffFile, type CommentThread } from '../../types/diff';
import { isSafariBrowser } from '../utils/browser';

import { Checkbox } from './Checkbox';

interface FileListProps {
  files: DiffFile[];
  onScrollToFile: (path: string) => void;
  onFileSelected?: () => void;
  comments: CommentThread[];
  reviewedFiles: Set<string>;
  onToggleReviewed: (path: string) => void;
  onToggleFolderReviewed: (path: string, reviewed: boolean) => void;
  selectedFileIndex: number | null;
}

interface TreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: TreeNode[];
  file?: DiffFile;
}

function TreeIndentGuides({ depth }: { depth: number }) {
  if (depth === 0) {
    return null;
  }

  return (
    <div className="flex h-full shrink-0 self-stretch" aria-hidden="true">
      {Array.from({ length: depth }, (_, index) => (
        <span key={index} className="file-tree-level-guide" />
      ))}
    </div>
  );
}

function getAllDirectoryPaths(node: TreeNode): string[] {
  if (!node.isDirectory || !node.children) return [];
  const paths: string[] = [];
  if (node.path) paths.push(node.path);
  node.children.forEach((child) => {
    paths.push(...getAllDirectoryPaths(child));
  });
  return paths;
}

function getReviewedDirectoryPaths(node: TreeNode, reviewedFiles: Set<string>): Set<string> {
  const reviewedDirectoryPaths = new Set<string>();

  const visit = (currentNode: TreeNode): boolean => {
    if (currentNode.file) {
      return reviewedFiles.has(currentNode.file.path);
    }

    if (!currentNode.isDirectory || !currentNode.children || currentNode.children.length === 0) {
      return false;
    }

    const childrenReviewed = currentNode.children.map((child) => visit(child));
    const areAllChildrenReviewed = childrenReviewed.every(Boolean);
    if (areAllChildrenReviewed && currentNode.path) {
      reviewedDirectoryPaths.add(currentNode.path);
    }
    return areAllChildrenReviewed;
  };

  visit(node);
  return reviewedDirectoryPaths;
}

function buildFileTree(files: DiffFile[]): TreeNode {
  const root: TreeNode = {
    name: '',
    path: '',
    isDirectory: true,
    children: [],
  };

  files.forEach((file) => {
    const parts = file.path.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!part) continue;

      const isLast = i === parts.length - 1;
      const pathSoFar = parts.slice(0, i + 1).join('/');

      if (!current.children) {
        current.children = [];
      }

      let child = current.children.find((c) => c.name === part && c.isDirectory === !isLast);

      if (!child) {
        child = {
          name: part,
          path: pathSoFar,
          isDirectory: !isLast,
          children: isLast ? undefined : [],
          file: isLast ? file : undefined,
        };
        current.children.push(child);
      }

      current = child;
    }
  });

  // Collapse single child directories
  const collapseDirectories = (node: TreeNode): TreeNode => {
    if (!node.isDirectory || !node.children) {
      return node;
    }

    // First, recursively collapse children
    node.children = node.children.map(collapseDirectories);

    // If this directory has only one child directory (no files), collapse them
    if (node.children.length === 1 && node.children[0]?.isDirectory && node.children[0]?.children) {
      const child = node.children[0];
      if (child) {
        // Don't collapse the root node - keep the full path structure
        if (!node.name) {
          return node;
        }
        return {
          ...node,
          name: `${node.name}/${child.name}`,
          path: child.path,
          children: child.children,
        };
      }
    }

    return node;
  };

  return collapseDirectories(root);
}

export const FileList = memo(function FileList({
  files,
  onScrollToFile,
  onFileSelected,
  comments,
  reviewedFiles,
  onToggleReviewed,
  onToggleFolderReviewed,
  selectedFileIndex,
}: FileListProps) {
  const fileTree = useMemo(() => buildFileTree(files), [files]);
  const shouldUseStickyDirectoryHeaders = useMemo(
    () => !isSafariBrowser(typeof navigator === 'undefined' ? '' : navigator.userAgent),
    [],
  );
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dirContainerRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const stickyContainerStyle = {
    '--dir-row-height': 'calc(var(--spacing, 0.25rem) * 9)',
  } as CSSProperties;

  // Initialize with all directories expanded
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(
    () => new Set(getAllDirectoryPaths(fileTree)),
  );
  const [filterText, setFilterText] = useState('');

  const commentCountMap = useMemo(() => {
    const counts = new Map<string, number>();
    comments.forEach((comment) => {
      counts.set(comment.file, (counts.get(comment.file) ?? 0) + 1);
    });
    return counts;
  }, [comments]);

  const fileIndexMap = useMemo(() => {
    const indices = new Map<string, number>();
    files.forEach((file, index) => {
      indices.set(file.path, index);
    });
    return indices;
  }, [files]);
  const diffTotals = useMemo(
    () =>
      files.reduce(
        (totals, file) => ({
          additions: totals.additions + file.additions,
          deletions: totals.deletions + file.deletions,
        }),
        { additions: 0, deletions: 0 },
      ),
    [files],
  );
  const reviewedDirectoryPaths = useMemo(
    () => getReviewedDirectoryPaths(fileTree, reviewedFiles),
    [fileTree, reviewedFiles],
  );

  // Filter the file tree based on search text
  const filteredFileTree = useMemo(() => {
    const normalizedFilter = filterText.trim().toLowerCase();

    const filterTreeNode = (node: TreeNode): TreeNode | null => {
      if (!normalizedFilter) return node;

      if (node.isDirectory && node.children) {
        const filteredChildren = node.children
          .map((child) => filterTreeNode(child))
          .filter((child) => child !== null);

        if (filteredChildren.length > 0) {
          return { ...node, children: filteredChildren };
        }
        return null;
      } else if (node.file) {
        // Check if file name matches filter
        if (node.file.path.toLowerCase().includes(normalizedFilter)) {
          return node;
        }
        return null;
      }

      return null;
    };

    return (
      filterTreeNode(fileTree) || {
        ...fileTree,
        children: [],
      }
    );
  }, [fileTree, filterText]);

  const getFileIcon = (status: DiffFile['status']) => {
    const iconProps = { size: 16, strokeWidth: 2, className: 'shrink-0' };

    switch (status) {
      case 'added':
        return <FilePlus {...iconProps} className="file-tree-icon-added shrink-0" />;
      case 'deleted':
        return <FileX {...iconProps} className="file-tree-icon-deleted shrink-0" />;
      case 'renamed':
        return <FilePen {...iconProps} className="file-tree-icon-modified shrink-0" />;
      default:
        return <FileDiff {...iconProps} className="file-tree-icon-modified shrink-0" />;
    }
  };

  const toggleDirectory = (path: string) => {
    setExpandedDirs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const allPaths = useMemo(() => getAllDirectoryPaths(fileTree), [fileTree]);
  const isAllExpanded = expandedDirs.size === allPaths.length && allPaths.length > 0;

  const toggleAllDirectories = () => {
    // If all directories are expanded, collapse all. Otherwise, expand all.
    if (isAllExpanded) {
      setExpandedDirs(new Set());
    } else {
      setExpandedDirs(new Set(allPaths));
    }
  };

  const handleDirectoryClick = (event: MouseEvent<HTMLDivElement>, path: string) => {
    if (!shouldUseStickyDirectoryHeaders) {
      toggleDirectory(path);
      return;
    }

    const container = scrollContainerRef.current;
    const row = event.currentTarget;

    if (!container) {
      toggleDirectory(path);
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    const topOffset = Number.parseFloat(getComputedStyle(row).top || '0');
    const relativeTop = rowRect.top - containerRect.top;
    const isSticky = relativeTop <= topOffset + 1;

    if (isSticky) {
      const wrapper = dirContainerRefs.current.get(path);
      const firstChild = wrapper?.querySelector<HTMLElement>(
        '[data-tree-row="true"]:not([data-dir-header="true"])',
      );
      const rowHeight = row.getBoundingClientRect().height || 0;
      const target = firstChild ?? row;
      const depthValue = Number.parseInt(target.dataset.depth || row.dataset.depth || '0', 10);
      const stackedOffset = rowHeight * depthValue;
      const targetScrollTop = Math.max(0, target.offsetTop - stackedOffset);

      if (Math.abs(container.scrollTop - targetScrollTop) <= 1) {
        toggleDirectory(path);
        return;
      }

      container.scrollTo({ top: targetScrollTop });
      return;
    }

    toggleDirectory(path);
  };

  const renderTreeNode = (node: TreeNode, depth: number = 0): React.ReactNode => {
    if (node.isDirectory && node.children) {
      const isExpanded = expandedDirs.has(node.path);
      const isReviewed = reviewedDirectoryPaths.has(node.path);

      return (
        <div
          key={node.path}
          data-dir-container={node.path || undefined}
          ref={(el) => {
            if (!node.path) return;
            if (el) {
              dirContainerRefs.current.set(node.path, el);
            } else {
              dirContainerRefs.current.delete(node.path);
            }
          }}
        >
          {node.name && (
            <div
              className={`${shouldUseStickyDirectoryHeaders ? 'sticky ' : ''}group flex min-h-8 items-stretch pr-3 hover:bg-github-bg-tertiary cursor-pointer bg-github-bg-secondary ${
                isReviewed ? 'opacity-70' : ''
              }`}
              data-dir-header="true"
              data-tree-row="true"
              data-depth={depth}
              style={{
                top: shouldUseStickyDirectoryHeaders
                  ? `calc(${depth} * var(--dir-row-height))`
                  : undefined,
                zIndex: shouldUseStickyDirectoryHeaders ? 1000 - depth : undefined,
              }}
              onClick={(event) => handleDirectoryClick(event, node.path)}
            >
              <TreeIndentGuides depth={depth} />
              <div className="flex min-w-0 flex-1 items-center gap-1 pl-1">
                <span className="shrink-0 text-code-line-number">
                  {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </span>
                <span className="flex shrink-0 items-center group-hover:hidden">
                  {isExpanded ? (
                    <FolderOpen size={16} className="text-code-line-number" />
                  ) : (
                    <Folder size={16} className="text-code-line-number" />
                  )}
                </span>
                <span className="hidden shrink-0 items-center group-hover:flex">
                  <Checkbox
                    checked={isReviewed}
                    onChange={() => {
                      onToggleFolderReviewed(node.path, !isReviewed);
                    }}
                    title={
                      isReviewed ? 'Mark all files as not reviewed' : 'Mark all files as reviewed'
                    }
                    className="z-10"
                  />
                </span>
                <span
                  className={`min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm text-github-text-primary ${
                    isReviewed ? 'line-through text-github-text-muted' : ''
                  }`}
                  title={node.name}
                >
                  {node.name}
                </span>
              </div>
            </div>
          )}
          {(isExpanded || !node.name) &&
            node.children.map((child) => renderTreeNode(child, node.name ? depth + 1 : depth))}
        </div>
      );
    } else if (node.file) {
      const file = node.file;
      const commentCount = commentCountMap.get(file.path) ?? 0;
      const isReviewed = reviewedFiles.has(file.path);
      const fileIndex = fileIndexMap.get(file.path) ?? -1;
      const isSelected = selectedFileIndex !== null && selectedFileIndex === fileIndex;

      return (
        <div
          key={`file:${file.path}`}
          className={`flex min-h-8 items-stretch pr-3 hover:bg-github-bg-tertiary cursor-pointer transition-colors ${
            isReviewed ? 'opacity-70' : ''
          } ${isSelected ? 'file-tree-row-selected' : ''}`}
          data-file-row="true"
          data-tree-row="true"
          data-depth={depth}
          onClick={() => {
            onScrollToFile(file.path);
            onFileSelected?.();
          }}
        >
          <TreeIndentGuides depth={depth} />
          <div className="flex min-w-0 flex-1 items-center gap-1 pl-1">
            <Checkbox
              checked={isReviewed}
              onChange={() => {
                onToggleReviewed(file.path);
              }}
              title={isReviewed ? 'Mark as not reviewed' : 'Mark as reviewed'}
              className="z-10 shrink-0"
            />
            {getFileIcon(node.file.status)}
            <span
              className={`min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm text-github-text-primary ${
                isReviewed ? 'line-through text-github-text-muted' : ''
              }`}
              title={node.file.path}
            >
              {node.name}
            </span>
            {commentCount > 0 && (
              <span className="ml-auto flex shrink-0 items-center gap-1 text-sm font-medium text-github-warning">
                <MessageSquare size={14} />
                {commentCount}
              </span>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-github-border p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="m-0 text-xs font-medium text-github-text-muted">
            Files changed ({files.length})
          </h3>
          <div className="flex items-center gap-2">
            <span
              className="inline-flex gap-1 whitespace-nowrap text-xs font-medium"
              title="Total additions and deletions"
              aria-label={`${diffTotals.additions} additions and ${diffTotals.deletions} deletions`}
            >
              <span className="text-code-accent">+{diffTotals.additions}</span>
              <span className="text-code-danger">-{diffTotals.deletions}</span>
            </span>
            <button
              onClick={toggleAllDirectories}
              className="rounded p-1 text-code-line-number transition-colors hover:bg-github-bg-tertiary hover:text-github-text-primary"
              title={isAllExpanded ? 'Collapse all' : 'Expand all'}
            >
              {isAllExpanded ? <ChevronsDownUp size={14} /> : <ChevronsUpDown size={14} />}
            </button>
          </div>
        </div>
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-code-line-number"
          />
          <input
            type="text"
            placeholder="Filter files…"
            aria-label="Filter files…"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="h-8 w-full rounded-md border border-github-border bg-github-bg-primary py-1.5 pl-8 pr-3 text-sm text-github-text-primary placeholder:text-code-line-number focus:border-github-text-muted focus:outline-none"
          />
        </div>
      </div>

      <div
        className="relative z-0 min-h-0 flex-1 overflow-y-auto py-1"
        style={stickyContainerStyle}
        ref={scrollContainerRef}
      >
        {filteredFileTree.children?.map((child) => renderTreeNode(child))}
      </div>
    </div>
  );
});
