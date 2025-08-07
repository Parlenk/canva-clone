CREATE TABLE "resize_session" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text,
	"projectId" text,
	"originalCanvas" jsonb NOT NULL,
	"targetDimensions" jsonb NOT NULL,
	"aiResult" jsonb NOT NULL,
	"userRating" integer,
	"feedbackText" text,
	"manualCorrections" jsonb,
	"processingTime" integer,
	"createdAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_data" (
	"id" text PRIMARY KEY NOT NULL,
	"sessionId" text,
	"inputFeatures" jsonb NOT NULL,
	"expectedOutput" jsonb NOT NULL,
	"qualityScore" real NOT NULL,
	"validated" boolean,
	"createdAt" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "resize_session" ADD CONSTRAINT "resize_session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resize_session" ADD CONSTRAINT "resize_session_projectId_project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_data" ADD CONSTRAINT "training_data_sessionId_resize_session_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."resize_session"("id") ON DELETE cascade ON UPDATE no action;