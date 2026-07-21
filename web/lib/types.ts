export type Category = { slug: string; name: string };
export type InstructorCard = { name: string; avatar_url: string | null };
export type InstructorBio = InstructorCard & { bio_md: string | null };

export type CourseCard = {
  slug: string;
  title: string;
  subtitle: string;
  description_md: string;
  hero_image_url: string | null;
  level: "beginner" | "intermediate" | "advanced";
  certification_enabled: boolean;
  published_at: string | null;
  enrolled_count: number;
  lesson_count: number;
  total_duration_seconds: number;
  review_count: number;
  avg_rating: number | null;
  categories: Category[];
  instructors: InstructorCard[];
};

export type Lesson = {
  slug: string;
  title: string;
  kind: "video" | "text" | "download" | "external" | "replay";
  duration_seconds: number;
  free_preview: boolean;
};

export type Module = {
  title: string;
  kind: "standard" | "worksheets" | "resources" | "bonus";
  lessons: Lesson[];
};

export type CourseDetail = Omit<CourseCard, "instructors"> & {
  trailer_video_id: string | null;
  instructors: InstructorBio[];
  modules: Module[];
  attachments: { title: string; kind: "file" | "link" }[];
};
