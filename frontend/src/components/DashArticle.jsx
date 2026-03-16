import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import DOMPurify from "dompurify";
import { isAdmin, getUserRole } from "../utils/auth";
import { FaCalendar } from "react-icons/fa";
import axios from "../utils/axiosConfig";
import getCategoryColor from "../utils/getCategoryColor";

export default function ArticleCard({
  imageUrl,
  title,
  excerpt,
  category,
  onClick,
  articleId,
  onEdit,
  onDelete,
  slug,
  showRelated = false,
  published_at,
}) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const userRole = getUserRole();
  const canEdit = isAdmin();
  const canDelete = userRole === "admin";

  useEffect(() => {
    if (expanded && showRelated && category) {
      const fetchRelated = async () => {
        try {
          const response = await axios.get("/api/articles", {
            params: { category: category.toLowerCase(), limit: 3 },
          });
          const filtered = response.data.data
            .filter((a) => a.slug !== slug)
            .slice(0, 3);
          setRelatedArticles(filtered);
        } catch (error) {
          console.error("Error fetching related articles:", error);
        }
      };
      fetchRelated();
    }
  }, [expanded, showRelated, category, slug]);

  const handleClick = () => {
    if (showRelated) {
      setExpanded(!expanded);
    } else if (onClick) {
      onClick();
    }
  };

  const finalDate = published_at
    ? new Date(published_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";
  const finalTime = published_at
    ? new Date(published_at).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : "";

  return (
    <>
      <div
        className="bg-white rounded-lg overflow-hidden shadow-lg border border-gray-100 h-full flex flex-col cursor-pointer hover:shadow-xl transition-shadow"
        onClick={handleClick}
      >
        <div className="relative">
          <img
            className="w-full h-56 object-cover"
            src={imageUrl}
            alt={title}
          />
          {canEdit && (
            <div className="absolute top-2 right-2 flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit ? onEdit() : navigate(`/edit-article/${articleId}`);
                }}
                className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 shadow-sm"
              >
                <Pencil size={14} />
              </button>
              {canDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete
                      ? onDelete()
                      : navigate(`/delete-article/${articleId}`);
                  }}
                  className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 shadow-sm"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          )}
        </div>
        <div className="p-4 grow flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <span
              className={`text-xs font-semibold uppercase px-2 py-1 rounded ${getCategoryColor(category)}`}
            >
              {category}
            </span>
            <span className="text-xs text-gray-500 text-right flex items-center">
              <FaCalendar className="mr-1" />
              {finalDate} {finalTime}
            </span>
          </div>
          <h3 className="font-bold text-lg mb-2 text-gray-800 grow">
            {DOMPurify.sanitize(title)}
          </h3>
          {excerpt && (
            <p className="text-gray-600 text-sm mb-4">
              {DOMPurify.sanitize(excerpt)}
            </p>
          )}

          {/* Spacer to push 'Read More' to the bottom */}
          <div className="grow"></div>

          <span className="text-blue-600 font-semibold text-sm hover:underline mt-2">
            {showRelated
              ? expanded
                ? "Hide Related ▲"
                : "Show Related ▼"
              : "Read More >"}
          </span>
        </div>
      </div>

      {expanded && showRelated && relatedArticles.length > 0 && (
        <div className="mt-6 border-t-2 border-gray-200 pt-6">
          <h3 className="text-xl font-serif font-bold text-gray-900 mb-4">
            More from {category}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedArticles.map((article) => (
              <div
                key={article.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-all"
                onClick={() => navigate(`/article/${article.slug}`)}
              >
                <div className="h-32 overflow-hidden">
                  <img
                    src={
                      article.featured_image ||
                      "https://placehold.co/400x200/e2e8f0/64748b?text=No+Image"
                    }
                    alt={article.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded uppercase">
                    {article.categories && article.categories.length > 0
                      ? article.categories[0].name
                      : "Uncategorized"}
                  </span>
                  <h4 className="text-sm font-serif font-bold text-gray-900 mt-2 line-clamp-2">
                    {article.title}
                  </h4>
                  <p
                    className="text-xs text-gray-500 mt-1 hover:underline cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      const authorName =
                        article.author && article.author.user
                          ? article.author.user.name
                          : article.author
                            ? article.author.name
                            : "Unknown Author";
                      navigate(`/author/${encodeURIComponent(authorName)}`);
                    }}
                  >
                    {article.author && article.author.user
                      ? article.author.user.name
                      : article.author
                        ? article.author.name
                        : "Unknown Author"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
