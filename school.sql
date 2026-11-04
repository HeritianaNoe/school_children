--
-- PostgreSQL database dump
--

\restrict N2I06JAFFBgpBlgB5MdR38nQ6xjCc5ooYX4m7IAsGeWuXWjWK6hfolVGgZeR28g

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: AssessmentType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AssessmentType" AS ENUM (
    'HOMEWORK',
    'TEST',
    'EXAM'
);


ALTER TYPE public."AssessmentType" OWNER TO postgres;

--
-- Name: AttendanceStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AttendanceStatus" AS ENUM (
    'PRESENT',
    'ABSENT',
    'LATE',
    'EXCUSED'
);


ALTER TYPE public."AttendanceStatus" OWNER TO postgres;

--
-- Name: PayslipStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PayslipStatus" AS ENUM (
    'DRAFT',
    'VALIDATED',
    'PAID'
);


ALTER TYPE public."PayslipStatus" OWNER TO postgres;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Role" AS ENUM (
    'ADMIN',
    'DIRECTOR',
    'MANAGER',
    'TEACHER',
    'STUDENT'
);


ALTER TYPE public."Role" OWNER TO postgres;

--
-- Name: SessionStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SessionStatus" AS ENUM (
    'PLANNED',
    'DONE',
    'CANCELLED'
);


ALTER TYPE public."SessionStatus" OWNER TO postgres;

--
-- Name: Sex; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Sex" AS ENUM (
    'M',
    'F'
);


ALTER TYPE public."Sex" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Announcement; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Announcement" (
    id text NOT NULL,
    "authorId" text NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    published boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Announcement" OWNER TO postgres;

--
-- Name: Assessment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Assessment" (
    id text NOT NULL,
    "courseId" text NOT NULL,
    "termId" text NOT NULL,
    title text NOT NULL,
    type public."AssessmentType" NOT NULL,
    "maxScore" double precision DEFAULT 20 NOT NULL,
    coefficient double precision DEFAULT 1 NOT NULL,
    date timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Assessment" OWNER TO postgres;

--
-- Name: Classe; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Classe" (
    id text NOT NULL,
    name text NOT NULL,
    year text NOT NULL
);


ALTER TABLE public."Classe" OWNER TO postgres;

--
-- Name: Comment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Comment" (
    id text NOT NULL,
    "authorId" text NOT NULL,
    body text NOT NULL,
    "studentId" text,
    "teacherId" text,
    "sessionId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Comment" OWNER TO postgres;

--
-- Name: Course; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Course" (
    id text NOT NULL,
    "classeId" text NOT NULL,
    "subjectId" text NOT NULL,
    "teacherId" text NOT NULL,
    coefficient double precision DEFAULT 1 NOT NULL
);


ALTER TABLE public."Course" OWNER TO postgres;

--
-- Name: Grade; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Grade" (
    id text NOT NULL,
    "assessmentId" text NOT NULL,
    "studentId" text NOT NULL,
    score double precision,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Grade" OWNER TO postgres;

--
-- Name: Notification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Notification" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    data jsonb,
    "dedupeKey" text NOT NULL,
    "readAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Notification" OWNER TO postgres;

--
-- Name: Payslip; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Payslip" (
    id text NOT NULL,
    "teacherId" text NOT NULL,
    month text NOT NULL,
    "totalMinutes" integer NOT NULL,
    "hourlyRate" numeric(12,2) NOT NULL,
    gross numeric(14,2) NOT NULL,
    status public."PayslipStatus" DEFAULT 'DRAFT'::public."PayslipStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Payslip" OWNER TO postgres;

--
-- Name: Reclamation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Reclamation" (
    id text NOT NULL,
    "authorId" text NOT NULL,
    subject text NOT NULL,
    body text NOT NULL,
    status text DEFAULT 'OPEN'::text NOT NULL,
    response text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Reclamation" OWNER TO postgres;

--
-- Name: Session; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Session" (
    id text NOT NULL,
    "courseId" text NOT NULL,
    "teacherId" text NOT NULL,
    "startsAt" timestamp(3) without time zone NOT NULL,
    "endsAt" timestamp(3) without time zone NOT NULL,
    status public."SessionStatus" DEFAULT 'PLANNED'::public."SessionStatus" NOT NULL
);


ALTER TABLE public."Session" OWNER TO postgres;

--
-- Name: Student; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Student" (
    id text NOT NULL,
    "userId" text NOT NULL,
    matricule text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    "birthDate" timestamp(3) without time zone,
    "birthPlace" text,
    sex public."Sex",
    address text,
    phone text,
    "parentName" text,
    "parentPhone" text,
    "photoUrl" text,
    "registeredAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "classeId" text NOT NULL
);


ALTER TABLE public."Student" OWNER TO postgres;

--
-- Name: StudentAttendance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."StudentAttendance" (
    id text NOT NULL,
    "sessionId" text NOT NULL,
    "studentId" text NOT NULL,
    status public."AttendanceStatus" NOT NULL,
    "minutesLate" integer DEFAULT 0 NOT NULL,
    note text,
    "markedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."StudentAttendance" OWNER TO postgres;

--
-- Name: StudentPhoto; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."StudentPhoto" (
    "studentId" text NOT NULL,
    data bytea NOT NULL,
    mime text NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."StudentPhoto" OWNER TO postgres;

--
-- Name: Subject; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Subject" (
    id text NOT NULL,
    name text NOT NULL
);


ALTER TABLE public."Subject" OWNER TO postgres;

--
-- Name: Teacher; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Teacher" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "hourlyRate" numeric(12,2) NOT NULL
);


ALTER TABLE public."Teacher" OWNER TO postgres;

--
-- Name: TeacherAttendance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TeacherAttendance" (
    id text NOT NULL,
    "sessionId" text NOT NULL,
    "teacherId" text NOT NULL,
    status public."AttendanceStatus" NOT NULL,
    "arrivedAt" timestamp(3) without time zone,
    "leftAt" timestamp(3) without time zone,
    note text
);


ALTER TABLE public."TeacherAttendance" OWNER TO postgres;

--
-- Name: Term; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Term" (
    id text NOT NULL,
    name text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Term" OWNER TO postgres;

--
-- Name: TimetableSlot; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TimetableSlot" (
    id text NOT NULL,
    "courseId" text NOT NULL,
    "dayOfWeek" integer NOT NULL,
    "startTime" text NOT NULL,
    "endTime" text NOT NULL,
    room text
);


ALTER TABLE public."TimetableSlot" OWNER TO postgres;

--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    name text NOT NULL,
    role public."Role" NOT NULL,
    active boolean DEFAULT true NOT NULL,
    phone text,
    "photoUrl" text,
    sex public."Sex",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: UserPhoto; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UserPhoto" (
    "userId" text NOT NULL,
    data bytea NOT NULL,
    mime text NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."UserPhoto" OWNER TO postgres;

--
-- Data for Name: Announcement; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Announcement" (id, "authorId", title, body, published, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Assessment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Assessment" (id, "courseId", "termId", title, type, "maxScore", coefficient, date) FROM stdin;
cmw20gu5d004cr4zuheafexpm	cmw20gu1r000ir4zuhz78zu7y	cmw20gu5b004ar4zu5axevy7y	Interro 1	TEST	20	1	2026-11-01 00:00:00
cmw20gu5k004jr4zuohktxcbx	cmw20gu1u000kr4zuynytsn39	cmw20gu5b004ar4zu5axevy7y	Dictée 1	TEST	20	1	2026-11-01 00:00:00
cmw20gu5o004qr4zuii06kenb	cmw20gu1w000mr4zu6a4acvu0	cmw20gu5b004ar4zu5axevy7y	Fanadinana 1	TEST	20	1	2026-11-01 00:00:00
cmw20gu5s004xr4zug0ybscur	cmw20gu1y000or4zuxod2ugek	cmw20gu5b004ar4zu5axevy7y	Contrôle 1	TEST	20	1	2026-11-01 00:00:00
cmw20gu5x0054r4zuvucwhdkd	cmw20gu20000qr4zufyli33oo	cmw20gu5b004ar4zu5axevy7y	Interro 1	TEST	20	1	2026-11-01 00:00:00
cmw20gu62005br4zuwz5lvty5	cmw20gu22000sr4zu0cbqfp4o	cmw20gu5b004ar4zu5axevy7y	Dictée 1	TEST	20	1	2026-11-01 00:00:00
cmw20gu66005ir4zuqsgbp861	cmw20gu24000ur4zu1yv21fnq	cmw20gu5b004ar4zu5axevy7y	Fanadinana 1	TEST	20	1	2026-11-01 00:00:00
cmw20gu6a005pr4zudefu6nyn	cmw20gu25000wr4zux52jc1w9	cmw20gu5b004ar4zu5axevy7y	Contrôle 1	TEST	20	1	2026-11-01 00:00:00
\.


--
-- Data for Name: Classe; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Classe" (id, name, year) FROM stdin;
cmw20gu1h000br4zuliv6fjbd	6ème A	2026-2027
cmw20gu1k000cr4zu7sydftrt	5ème B	2026-2027
cmw20gu3b001hr4zuhcvrl7cc	6ème A	2025-2026
\.


--
-- Data for Name: Comment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Comment" (id, "authorId", body, "studentId", "teacherId", "sessionId", "createdAt") FROM stdin;
\.


--
-- Data for Name: Course; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Course" (id, "classeId", "subjectId", "teacherId", coefficient) FROM stdin;
cmw20gu1r000ir4zuhz78zu7y	cmw20gu1h000br4zuliv6fjbd	cmw20gu1l000dr4zu5xxc6orx	cmw20gu130003r4zu0ideli09	3
cmw20gu1u000kr4zuynytsn39	cmw20gu1h000br4zuliv6fjbd	cmw20gu1n000er4zuyio8rffy	cmw20gu190005r4zuxuqwmq30	2
cmw20gu1w000mr4zu6a4acvu0	cmw20gu1h000br4zuliv6fjbd	cmw20gu1p000fr4zu7ipjj13g	cmw20gu1c0007r4zu8a05484t	2
cmw20gu1y000or4zuxod2ugek	cmw20gu1h000br4zuliv6fjbd	cmw20gu1q000gr4zu1uhfoxga	cmw20gu1e0009r4zu15vji90w	1.5
cmw20gu20000qr4zufyli33oo	cmw20gu1k000cr4zu7sydftrt	cmw20gu1l000dr4zu5xxc6orx	cmw20gu130003r4zu0ideli09	3
cmw20gu22000sr4zu0cbqfp4o	cmw20gu1k000cr4zu7sydftrt	cmw20gu1n000er4zuyio8rffy	cmw20gu190005r4zuxuqwmq30	2
cmw20gu24000ur4zu1yv21fnq	cmw20gu1k000cr4zu7sydftrt	cmw20gu1p000fr4zu7ipjj13g	cmw20gu1c0007r4zu8a05484t	2
cmw20gu25000wr4zux52jc1w9	cmw20gu1k000cr4zu7sydftrt	cmw20gu1q000gr4zu1uhfoxga	cmw20gu1e0009r4zu15vji90w	1.5
cmw20gu3d001ir4zuuinkdp69	cmw20gu3b001hr4zuhcvrl7cc	cmw20gu1l000dr4zu5xxc6orx	cmw20gu130003r4zu0ideli09	3
cmw20gu3d001jr4zui7em7g1w	cmw20gu3b001hr4zuhcvrl7cc	cmw20gu1n000er4zuyio8rffy	cmw20gu190005r4zuxuqwmq30	2
\.


--
-- Data for Name: Grade; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Grade" (id, "assessmentId", "studentId", score, "updatedAt") FROM stdin;
cmw20gu5g004dr4zut90sthv1	cmw20gu5d004cr4zuheafexpm	cmw20gu28000xr4zuz8eoxg3z	8	2026-11-04 11:06:02.788
cmw20gu5g004er4zurs8ct3z0	cmw20gu5d004cr4zuheafexpm	cmw20gu2e000zr4zuqfi6b8n6	15	2026-11-04 11:06:02.788
cmw20gu5g004fr4zuibrb7ydg	cmw20gu5d004cr4zuheafexpm	cmw20gu2i0011r4zuk72sozrj	10	2026-11-04 11:06:02.788
cmw20gu5g004gr4zulsv947ug	cmw20gu5d004cr4zuheafexpm	cmw20gu2m0013r4zu2qz08zu4	17	2026-11-04 11:06:02.788
cmw20gu5g004hr4zuapr0v0x5	cmw20gu5d004cr4zuheafexpm	cmw20gu2q0015r4zugl59y2ry	\N	2026-11-04 11:06:02.788
cmw20gu5l004kr4zuh427oesv	cmw20gu5k004jr4zuohktxcbx	cmw20gu28000xr4zuz8eoxg3z	8	2026-11-04 11:06:02.794
cmw20gu5l004lr4zu77vdzge3	cmw20gu5k004jr4zuohktxcbx	cmw20gu2e000zr4zuqfi6b8n6	15	2026-11-04 11:06:02.794
cmw20gu5l004mr4zuke999oeb	cmw20gu5k004jr4zuohktxcbx	cmw20gu2i0011r4zuk72sozrj	10	2026-11-04 11:06:02.794
cmw20gu5l004nr4zuhqrnbowv	cmw20gu5k004jr4zuohktxcbx	cmw20gu2m0013r4zu2qz08zu4	17	2026-11-04 11:06:02.794
cmw20gu5l004or4zu7on52tjr	cmw20gu5k004jr4zuohktxcbx	cmw20gu2q0015r4zugl59y2ry	\N	2026-11-04 11:06:02.794
cmw20gu5q004rr4zupjzdkhll	cmw20gu5o004qr4zuii06kenb	cmw20gu28000xr4zuz8eoxg3z	8	2026-11-04 11:06:02.799
cmw20gu5q004sr4zu6r2842ti	cmw20gu5o004qr4zuii06kenb	cmw20gu2e000zr4zuqfi6b8n6	15	2026-11-04 11:06:02.799
cmw20gu5q004tr4zu6b4qdjgi	cmw20gu5o004qr4zuii06kenb	cmw20gu2i0011r4zuk72sozrj	10	2026-11-04 11:06:02.799
cmw20gu5q004ur4zuxeuuftfl	cmw20gu5o004qr4zuii06kenb	cmw20gu2m0013r4zu2qz08zu4	17	2026-11-04 11:06:02.799
cmw20gu5q004vr4zua2g6frx0	cmw20gu5o004qr4zuii06kenb	cmw20gu2q0015r4zugl59y2ry	\N	2026-11-04 11:06:02.799
cmw20gu5v004yr4zu6uieubf8	cmw20gu5s004xr4zug0ybscur	cmw20gu28000xr4zuz8eoxg3z	8	2026-11-04 11:06:02.803
cmw20gu5v004zr4zuqv1g6gd4	cmw20gu5s004xr4zug0ybscur	cmw20gu2e000zr4zuqfi6b8n6	15	2026-11-04 11:06:02.803
cmw20gu5v0050r4zuniwk6ted	cmw20gu5s004xr4zug0ybscur	cmw20gu2i0011r4zuk72sozrj	10	2026-11-04 11:06:02.803
cmw20gu5v0051r4zumbwhq1hi	cmw20gu5s004xr4zug0ybscur	cmw20gu2m0013r4zu2qz08zu4	17	2026-11-04 11:06:02.803
cmw20gu5v0052r4zujt26ayuk	cmw20gu5s004xr4zug0ybscur	cmw20gu2q0015r4zugl59y2ry	\N	2026-11-04 11:06:02.803
cmw20gu5z0055r4zu9o9myvv5	cmw20gu5x0054r4zuvucwhdkd	cmw20gu2u0017r4zuwvktvt7y	8	2026-11-04 11:06:02.808
cmw20gu5z0056r4zu5umfg78f	cmw20gu5x0054r4zuvucwhdkd	cmw20gu2y0019r4zunh5q39ei	15	2026-11-04 11:06:02.808
cmw20gu5z0057r4zudjqqkuxl	cmw20gu5x0054r4zuvucwhdkd	cmw20gu31001br4zukucssxk5	10	2026-11-04 11:06:02.808
cmw20gu5z0058r4zub8d09c6o	cmw20gu5x0054r4zuvucwhdkd	cmw20gu35001dr4zuce41fjnx	17	2026-11-04 11:06:02.808
cmw20gu5z0059r4zu8tc5f7w1	cmw20gu5x0054r4zuvucwhdkd	cmw20gu38001fr4zuyr9bmyr7	\N	2026-11-04 11:06:02.808
cmw20gu63005cr4zu9f2g4fh6	cmw20gu62005br4zuwz5lvty5	cmw20gu2u0017r4zuwvktvt7y	8	2026-11-04 11:06:02.812
cmw20gu63005dr4zuo44kpbrx	cmw20gu62005br4zuwz5lvty5	cmw20gu2y0019r4zunh5q39ei	15	2026-11-04 11:06:02.812
cmw20gu63005er4zuop1x8gcc	cmw20gu62005br4zuwz5lvty5	cmw20gu31001br4zukucssxk5	10	2026-11-04 11:06:02.812
cmw20gu63005fr4zukpo4uuw9	cmw20gu62005br4zuwz5lvty5	cmw20gu35001dr4zuce41fjnx	17	2026-11-04 11:06:02.812
cmw20gu63005gr4zuhf95j1f9	cmw20gu62005br4zuwz5lvty5	cmw20gu38001fr4zuyr9bmyr7	\N	2026-11-04 11:06:02.812
cmw20gu68005jr4zu5g54el61	cmw20gu66005ir4zuqsgbp861	cmw20gu2u0017r4zuwvktvt7y	8	2026-11-04 11:06:02.816
cmw20gu68005kr4zugedxllpj	cmw20gu66005ir4zuqsgbp861	cmw20gu2y0019r4zunh5q39ei	15	2026-11-04 11:06:02.816
cmw20gu68005lr4zuwuezjb8v	cmw20gu66005ir4zuqsgbp861	cmw20gu31001br4zukucssxk5	10	2026-11-04 11:06:02.816
cmw20gu68005mr4zu9eotnfd0	cmw20gu66005ir4zuqsgbp861	cmw20gu35001dr4zuce41fjnx	17	2026-11-04 11:06:02.816
cmw20gu68005nr4zu59ju5dxe	cmw20gu66005ir4zuqsgbp861	cmw20gu38001fr4zuyr9bmyr7	\N	2026-11-04 11:06:02.816
cmw20gu6c005qr4zux4fg2aa9	cmw20gu6a005pr4zudefu6nyn	cmw20gu2u0017r4zuwvktvt7y	8	2026-11-04 11:06:02.82
cmw20gu6c005rr4zueyueccku	cmw20gu6a005pr4zudefu6nyn	cmw20gu2y0019r4zunh5q39ei	15	2026-11-04 11:06:02.82
cmw20gu6c005sr4zu090tjuy0	cmw20gu6a005pr4zudefu6nyn	cmw20gu31001br4zukucssxk5	10	2026-11-04 11:06:02.82
cmw20gu6c005tr4zutu7q0b0z	cmw20gu6a005pr4zudefu6nyn	cmw20gu35001dr4zuce41fjnx	17	2026-11-04 11:06:02.82
cmw20gu6c005ur4zu98u5ed97	cmw20gu6a005pr4zudefu6nyn	cmw20gu38001fr4zuyr9bmyr7	\N	2026-11-04 11:06:02.82
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Notification" (id, "userId", type, title, body, data, "dedupeKey", "readAt", "createdAt") FROM stdin;
cmw20gu8o005vr4zu4mtrvtlz	cmw20gu0t0000r4zup6xnwqre	STUDENT_LATE_WEEK	Retards fréquents	Andry Randria a accumulé 3 retard(s) cette semaine.	{"count": 3, "studentId": "cmw20gu28000xr4zuz8eoxg3z"}	STU_LATE:cmw20gu28000xr4zuz8eoxg3z:2026-11-02:cmw20gu0t0000r4zup6xnwqre	\N	2026-11-04 11:06:02.905
cmw20gu8o005wr4zucx98cqu6	cmw20gu0t0001r4zua2k9fqpu	STUDENT_LATE_WEEK	Retards fréquents	Andry Randria a accumulé 3 retard(s) cette semaine.	{"count": 3, "studentId": "cmw20gu28000xr4zuz8eoxg3z"}	STU_LATE:cmw20gu28000xr4zuz8eoxg3z:2026-11-02:cmw20gu0t0001r4zua2k9fqpu	\N	2026-11-04 11:06:02.905
cmw20gu8o005xr4zuphp1gv7a	cmw20gu28000yr4zu03vrn56p	STUDENT_LATE_WEEK	Retards fréquents	Andry Randria a accumulé 3 retard(s) cette semaine.	{"count": 3, "studentId": "cmw20gu28000xr4zuz8eoxg3z"}	STU_LATE:cmw20gu28000xr4zuz8eoxg3z:2026-11-02:cmw20gu28000yr4zu03vrn56p	\N	2026-11-04 11:06:02.905
\.


--
-- Data for Name: Payslip; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Payslip" (id, "teacherId", month, "totalMinutes", "hourlyRate", gross, status, "createdAt") FROM stdin;
\.


--
-- Data for Name: Reclamation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Reclamation" (id, "authorId", subject, body, status, response, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Session" (id, "courseId", "teacherId", "startsAt", "endsAt", status) FROM stdin;
cmw20gu3u002br4zu6zyi3d64	cmw20gu1r000ir4zuhz78zu7y	cmw20gu130003r4zu0ideli09	2026-11-04 08:00:00	2026-11-04 10:00:00	DONE
cmw20gu3x002dr4zuo4f7fovn	cmw20gu1u000kr4zuynytsn39	cmw20gu190005r4zuxuqwmq30	2026-11-03 08:00:00	2026-11-03 10:00:00	DONE
cmw20gu3z002fr4zu9dsxlfoa	cmw20gu1w000mr4zu6a4acvu0	cmw20gu1c0007r4zu8a05484t	2026-11-02 08:00:00	2026-11-02 10:00:00	DONE
cmw20gu41002hr4zutoe74pf8	cmw20gu1y000or4zuxod2ugek	cmw20gu1e0009r4zu15vji90w	2026-11-01 08:00:00	2026-11-01 10:00:00	DONE
cmw20gu42002jr4zuljt6fo8i	cmw20gu20000qr4zufyli33oo	cmw20gu130003r4zu0ideli09	2026-10-31 08:00:00	2026-10-31 10:00:00	DONE
cmw20gu44002lr4zuh97jp5d1	cmw20gu22000sr4zu0cbqfp4o	cmw20gu190005r4zuxuqwmq30	2026-10-30 08:00:00	2026-10-30 10:00:00	DONE
cmw20gu46002nr4zu0u0mrmem	cmw20gu24000ur4zu1yv21fnq	cmw20gu1c0007r4zu8a05484t	2026-10-29 08:00:00	2026-10-29 10:00:00	DONE
cmw20gu48002pr4zu3f9u3fr2	cmw20gu25000wr4zux52jc1w9	cmw20gu1e0009r4zu15vji90w	2026-10-28 08:00:00	2026-10-28 10:00:00	DONE
\.


--
-- Data for Name: Student; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Student" (id, "userId", matricule, "firstName", "lastName", "birthDate", "birthPlace", sex, address, phone, "parentName", "parentPhone", "photoUrl", "registeredAt", "classeId") FROM stdin;
cmw20gu28000xr4zuz8eoxg3z	cmw20gu28000yr4zu03vrn56p	M26-001	Andry	Randria	2014-01-05 00:00:00	Antananarivo	M	Lot II 10 Antananarivo	+261 34 00 00 01	Parent de Andry	+261 32 11 22 01	\N	2026-10-05 09:00:00	cmw20gu1h000br4zuliv6fjbd
cmw20gu2e000zr4zuqfi6b8n6	cmw20gu2e0010r4zur6rj9nlr	M26-002	Bodo	Ravelo	2014-02-06 00:00:00	Antananarivo	F	Lot II 11 Antananarivo	+261 34 00 00 02	Parent de Bodo	+261 32 11 22 02	\N	2026-10-06 09:00:00	cmw20gu1h000br4zuliv6fjbd
cmw20gu2i0011r4zuk72sozrj	cmw20gu2i0012r4zurbtvulro	M26-003	Chloé	Rakoto	2014-03-07 00:00:00	Antananarivo	M	Lot II 12 Antananarivo	+261 34 00 00 03	Parent de Chloé	+261 32 11 22 03	\N	2026-10-07 09:00:00	cmw20gu1h000br4zuliv6fjbd
cmw20gu2m0013r4zu2qz08zu4	cmw20gu2m0014r4zulhl4zgkm	M26-004	Dina	Rasoa	2014-04-08 00:00:00	Antananarivo	F	Lot II 13 Antananarivo	+261 34 00 00 04	Parent de Dina	+261 32 11 22 04	\N	2026-10-08 09:00:00	cmw20gu1h000br4zuliv6fjbd
cmw20gu2q0015r4zugl59y2ry	cmw20gu2q0016r4zu56iyfhlh	M26-005	Eric	Andrianina	2014-05-09 00:00:00	Antananarivo	M	Lot II 14 Antananarivo	+261 34 00 00 05	Parent de Eric	+261 32 11 22 05	\N	2026-10-09 09:00:00	cmw20gu1h000br4zuliv6fjbd
cmw20gu2u0017r4zuwvktvt7y	cmw20gu2u0018r4zusj3w24yq	M26-006	Faly	Hery	2014-01-05 00:00:00	Antananarivo	M	Lot II 10 Antananarivo	+261 34 00 00 06	Parent de Faly	+261 32 11 22 06	\N	2026-10-05 09:00:00	cmw20gu1k000cr4zu7sydftrt
cmw20gu2y0019r4zunh5q39ei	cmw20gu2y001ar4zunjic908h	M26-007	Gaby	Razafy	2014-02-06 00:00:00	Antananarivo	F	Lot II 11 Antananarivo	+261 34 00 00 07	Parent de Gaby	+261 32 11 22 07	\N	2026-10-06 09:00:00	cmw20gu1k000cr4zu7sydftrt
cmw20gu31001br4zukucssxk5	cmw20gu31001cr4zubigvhlld	M26-008	Hery	Ranaivo	2014-03-07 00:00:00	Antananarivo	M	Lot II 12 Antananarivo	+261 34 00 00 08	Parent de Hery	+261 32 11 22 08	\N	2026-10-07 09:00:00	cmw20gu1k000cr4zu7sydftrt
cmw20gu35001dr4zuce41fjnx	cmw20gu35001er4zuk9mp7ufx	M26-009	Iony	Rabe	2014-04-08 00:00:00	Antananarivo	F	Lot II 13 Antananarivo	+261 34 00 00 09	Parent de Iony	+261 32 11 22 09	\N	2026-10-08 09:00:00	cmw20gu1k000cr4zu7sydftrt
cmw20gu38001fr4zuyr9bmyr7	cmw20gu38001gr4zuopfrgask	M26-010	Jao	Rakotomalala	2014-05-09 00:00:00	Antananarivo	M	Lot II 14 Antananarivo	+261 34 00 00 10	Parent de Jao	+261 32 11 22 10	\N	2026-10-09 09:00:00	cmw20gu1k000cr4zu7sydftrt
cmw20gu3f001kr4zueizre9ul	cmw20gu3f001lr4zuu821dn2f	M25-001	Koto	Rabary	2014-01-05 00:00:00	Antananarivo	M	Lot II 10 Antananarivo	+261 34 00 00 01	Parent de Koto	+261 32 11 22 01	\N	2026-10-05 09:00:00	cmw20gu3b001hr4zuhcvrl7cc
cmw20gu3j001mr4zujx3gf233	cmw20gu3j001nr4zui1sptcse	M25-002	Lala	Rasolofo	2014-02-06 00:00:00	Antananarivo	F	Lot II 11 Antananarivo	+261 34 00 00 02	Parent de Lala	+261 32 11 22 02	\N	2026-10-06 09:00:00	cmw20gu3b001hr4zuhcvrl7cc
cmw20gu3m001or4zutq4zcsh1	cmw20gu3m001pr4zuakze9nm4	M25-003	Mika	Andriamanana	2014-03-07 00:00:00	Antananarivo	M	Lot II 12 Antananarivo	+261 34 00 00 03	Parent de Mika	+261 32 11 22 03	\N	2026-10-07 09:00:00	cmw20gu3b001hr4zuhcvrl7cc
\.


--
-- Data for Name: StudentAttendance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."StudentAttendance" (id, "sessionId", "studentId", status, "minutesLate", note, "markedAt") FROM stdin;
cmw20gu4a002qr4zu48mnbe4a	cmw20gu3u002br4zu6zyi3d64	cmw20gu28000xr4zuz8eoxg3z	LATE	15	\N	2026-11-04 11:06:02.746
cmw20gu4a002rr4zukg43sor2	cmw20gu3u002br4zu6zyi3d64	cmw20gu2e000zr4zuqfi6b8n6	ABSENT	0	\N	2026-11-04 11:06:02.746
cmw20gu4a002sr4zuvfxlm9h9	cmw20gu3u002br4zu6zyi3d64	cmw20gu2i0011r4zuk72sozrj	PRESENT	0	\N	2026-11-04 11:06:02.746
cmw20gu4a002tr4zuk3d7cgmf	cmw20gu3u002br4zu6zyi3d64	cmw20gu2m0013r4zu2qz08zu4	PRESENT	0	\N	2026-11-04 11:06:02.746
cmw20gu4a002ur4zum8vgd81b	cmw20gu3u002br4zu6zyi3d64	cmw20gu2q0015r4zugl59y2ry	PRESENT	0	\N	2026-11-04 11:06:02.746
cmw20gu4h002xr4zui3yax05p	cmw20gu3x002dr4zuo4f7fovn	cmw20gu28000xr4zuz8eoxg3z	LATE	15	\N	2026-11-04 11:06:02.753
cmw20gu4h002yr4zuhq9ba5wd	cmw20gu3x002dr4zuo4f7fovn	cmw20gu2e000zr4zuqfi6b8n6	ABSENT	0	\N	2026-11-04 11:06:02.753
cmw20gu4h002zr4zuq8xegg3w	cmw20gu3x002dr4zuo4f7fovn	cmw20gu2i0011r4zuk72sozrj	PRESENT	0	\N	2026-11-04 11:06:02.753
cmw20gu4h0030r4zuhwwggm6m	cmw20gu3x002dr4zuo4f7fovn	cmw20gu2m0013r4zu2qz08zu4	PRESENT	0	\N	2026-11-04 11:06:02.753
cmw20gu4h0031r4zun2w7r8ju	cmw20gu3x002dr4zuo4f7fovn	cmw20gu2q0015r4zugl59y2ry	PRESENT	0	\N	2026-11-04 11:06:02.753
cmw20gu4l0034r4zuqrnbem8a	cmw20gu3z002fr4zu9dsxlfoa	cmw20gu28000xr4zuz8eoxg3z	LATE	15	\N	2026-11-04 11:06:02.758
cmw20gu4l0035r4zu7az8cs0c	cmw20gu3z002fr4zu9dsxlfoa	cmw20gu2e000zr4zuqfi6b8n6	ABSENT	0	\N	2026-11-04 11:06:02.758
cmw20gu4l0036r4zuh3e1pw2m	cmw20gu3z002fr4zu9dsxlfoa	cmw20gu2i0011r4zuk72sozrj	PRESENT	0	\N	2026-11-04 11:06:02.758
cmw20gu4l0037r4zuf6xb3n6a	cmw20gu3z002fr4zu9dsxlfoa	cmw20gu2m0013r4zu2qz08zu4	PRESENT	0	\N	2026-11-04 11:06:02.758
cmw20gu4l0038r4zuaa2gjb1s	cmw20gu3z002fr4zu9dsxlfoa	cmw20gu2q0015r4zugl59y2ry	PRESENT	0	\N	2026-11-04 11:06:02.758
cmw20gu4q003br4zu1g7bbh13	cmw20gu41002hr4zutoe74pf8	cmw20gu28000xr4zuz8eoxg3z	LATE	15	\N	2026-11-04 11:06:02.762
cmw20gu4q003cr4zuji44ki7h	cmw20gu41002hr4zutoe74pf8	cmw20gu2e000zr4zuqfi6b8n6	ABSENT	0	\N	2026-11-04 11:06:02.762
cmw20gu4q003dr4zub9lfkdfp	cmw20gu41002hr4zutoe74pf8	cmw20gu2i0011r4zuk72sozrj	PRESENT	0	\N	2026-11-04 11:06:02.762
cmw20gu4q003er4zulxuwwk8v	cmw20gu41002hr4zutoe74pf8	cmw20gu2m0013r4zu2qz08zu4	PRESENT	0	\N	2026-11-04 11:06:02.762
cmw20gu4q003fr4zuwpk7h0vd	cmw20gu41002hr4zutoe74pf8	cmw20gu2q0015r4zugl59y2ry	PRESENT	0	\N	2026-11-04 11:06:02.762
cmw20gu4u003ir4zu0sce8tio	cmw20gu42002jr4zuljt6fo8i	cmw20gu2u0017r4zuwvktvt7y	PRESENT	0	\N	2026-11-04 11:06:02.766
cmw20gu4u003jr4zufwv3yzjo	cmw20gu42002jr4zuljt6fo8i	cmw20gu2y0019r4zunh5q39ei	ABSENT	0	\N	2026-11-04 11:06:02.766
cmw20gu4u003kr4zufa4w0bzc	cmw20gu42002jr4zuljt6fo8i	cmw20gu31001br4zukucssxk5	PRESENT	0	\N	2026-11-04 11:06:02.766
cmw20gu4u003lr4zuhd36xnj5	cmw20gu42002jr4zuljt6fo8i	cmw20gu35001dr4zuce41fjnx	PRESENT	0	\N	2026-11-04 11:06:02.766
cmw20gu4u003mr4zuzg5vhoh8	cmw20gu42002jr4zuljt6fo8i	cmw20gu38001fr4zuyr9bmyr7	PRESENT	0	\N	2026-11-04 11:06:02.766
cmw20gu4y003pr4zuae0lftfp	cmw20gu44002lr4zuh97jp5d1	cmw20gu2u0017r4zuwvktvt7y	PRESENT	0	\N	2026-11-04 11:06:02.771
cmw20gu4y003qr4zuirqm6saa	cmw20gu44002lr4zuh97jp5d1	cmw20gu2y0019r4zunh5q39ei	ABSENT	0	\N	2026-11-04 11:06:02.771
cmw20gu4y003rr4zu5g9r2jnb	cmw20gu44002lr4zuh97jp5d1	cmw20gu31001br4zukucssxk5	PRESENT	0	\N	2026-11-04 11:06:02.771
cmw20gu4y003sr4zulth44vn5	cmw20gu44002lr4zuh97jp5d1	cmw20gu35001dr4zuce41fjnx	PRESENT	0	\N	2026-11-04 11:06:02.771
cmw20gu4y003tr4zutkfl669u	cmw20gu44002lr4zuh97jp5d1	cmw20gu38001fr4zuyr9bmyr7	PRESENT	0	\N	2026-11-04 11:06:02.771
cmw20gu52003wr4zuh89g61n3	cmw20gu46002nr4zu0u0mrmem	cmw20gu2u0017r4zuwvktvt7y	PRESENT	0	\N	2026-11-04 11:06:02.775
cmw20gu53003xr4zu2baebloo	cmw20gu46002nr4zu0u0mrmem	cmw20gu2y0019r4zunh5q39ei	ABSENT	0	\N	2026-11-04 11:06:02.775
cmw20gu53003yr4zup6h4tqq4	cmw20gu46002nr4zu0u0mrmem	cmw20gu31001br4zukucssxk5	PRESENT	0	\N	2026-11-04 11:06:02.775
cmw20gu53003zr4zuqx526u1u	cmw20gu46002nr4zu0u0mrmem	cmw20gu35001dr4zuce41fjnx	PRESENT	0	\N	2026-11-04 11:06:02.775
cmw20gu530040r4zuj5w7z4em	cmw20gu46002nr4zu0u0mrmem	cmw20gu38001fr4zuyr9bmyr7	PRESENT	0	\N	2026-11-04 11:06:02.775
cmw20gu570043r4zu2c6ghkma	cmw20gu48002pr4zu3f9u3fr2	cmw20gu2u0017r4zuwvktvt7y	PRESENT	0	\N	2026-11-04 11:06:02.779
cmw20gu570044r4zu87br50jn	cmw20gu48002pr4zu3f9u3fr2	cmw20gu2y0019r4zunh5q39ei	ABSENT	0	\N	2026-11-04 11:06:02.779
cmw20gu570045r4zupagtdzsb	cmw20gu48002pr4zu3f9u3fr2	cmw20gu31001br4zukucssxk5	PRESENT	0	\N	2026-11-04 11:06:02.779
cmw20gu570046r4zu784qlkjm	cmw20gu48002pr4zu3f9u3fr2	cmw20gu35001dr4zuce41fjnx	PRESENT	0	\N	2026-11-04 11:06:02.779
cmw20gu570047r4zuvsif5rcn	cmw20gu48002pr4zu3f9u3fr2	cmw20gu38001fr4zuyr9bmyr7	PRESENT	0	\N	2026-11-04 11:06:02.779
\.


--
-- Data for Name: StudentPhoto; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."StudentPhoto" ("studentId", data, mime, "updatedAt") FROM stdin;
\.


--
-- Data for Name: Subject; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Subject" (id, name) FROM stdin;
cmw20gu1l000dr4zu5xxc6orx	Mathématiques
cmw20gu1n000er4zuyio8rffy	Français
cmw20gu1p000fr4zu7ipjj13g	Malagasy
cmw20gu1q000gr4zu1uhfoxga	Histoire
\.


--
-- Data for Name: Teacher; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Teacher" (id, "userId", "hourlyRate") FROM stdin;
cmw20gu130003r4zu0ideli09	cmw20gu130004r4zupbxrp957	8000.00
cmw20gu190005r4zuxuqwmq30	cmw20gu190006r4zusxtrltak	9000.00
cmw20gu1c0007r4zu8a05484t	cmw20gu1c0008r4zu0t8fmg0y	8500.00
cmw20gu1e0009r4zu15vji90w	cmw20gu1f000ar4zujvr9wond	8200.00
\.


--
-- Data for Name: TeacherAttendance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TeacherAttendance" (id, "sessionId", "teacherId", status, "arrivedAt", "leftAt", note) FROM stdin;
cmw20gu4e002wr4zuf0zzxh5s	cmw20gu3u002br4zu6zyi3d64	cmw20gu130003r4zu0ideli09	PRESENT	\N	\N	\N
cmw20gu4j0033r4zu56mbnii4	cmw20gu3x002dr4zuo4f7fovn	cmw20gu190005r4zuxuqwmq30	LATE	2026-11-03 08:20:00	\N	\N
cmw20gu4o003ar4zun5fjghwp	cmw20gu3z002fr4zu9dsxlfoa	cmw20gu1c0007r4zu8a05484t	PRESENT	\N	\N	\N
cmw20gu4s003hr4zu7xehriha	cmw20gu41002hr4zutoe74pf8	cmw20gu1e0009r4zu15vji90w	PRESENT	\N	\N	\N
cmw20gu4w003or4zu12eabr9s	cmw20gu42002jr4zuljt6fo8i	cmw20gu130003r4zu0ideli09	PRESENT	\N	\N	\N
cmw20gu51003vr4zulolkdi1i	cmw20gu44002lr4zuh97jp5d1	cmw20gu190005r4zuxuqwmq30	LATE	2026-10-30 08:20:00	\N	\N
cmw20gu550042r4zutbbtg2pk	cmw20gu46002nr4zu0u0mrmem	cmw20gu1c0007r4zu8a05484t	PRESENT	\N	\N	\N
cmw20gu590049r4zuaoys61qm	cmw20gu48002pr4zu3f9u3fr2	cmw20gu1e0009r4zu15vji90w	PRESENT	\N	\N	\N
\.


--
-- Data for Name: Term; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Term" (id, name, "startDate", "endDate") FROM stdin;
cmw20gu5b004ar4zu5axevy7y	Trimestre 1	2026-09-05 00:00:00	2027-01-03 00:00:00
\.


--
-- Data for Name: TimetableSlot; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TimetableSlot" (id, "courseId", "dayOfWeek", "startTime", "endTime", room) FROM stdin;
cmw20gu3q001qr4zul80j1opd	cmw20gu1r000ir4zuhz78zu7y	1	08:00	10:00	Salle 1
cmw20gu3q001rr4zuuhf9qifc	cmw20gu22000sr4zu0cbqfp4o	1	08:00	10:00	Salle 2
cmw20gu3q001sr4zuz0x5b0hr	cmw20gu1u000kr4zuynytsn39	1	10:15	12:15	Salle 1
cmw20gu3q001tr4zumgjbdbfr	cmw20gu24000ur4zu1yv21fnq	1	10:15	12:15	Salle 2
cmw20gu3q001ur4zuhh44hnu4	cmw20gu1w000mr4zu6a4acvu0	2	08:00	10:00	Salle 1
cmw20gu3q001vr4zu3xafcfpc	cmw20gu25000wr4zux52jc1w9	2	08:00	10:00	Salle 2
cmw20gu3q001wr4zuxbwjflas	cmw20gu1y000or4zuxod2ugek	2	10:15	12:15	Salle 1
cmw20gu3q001xr4zujbxbwe86	cmw20gu20000qr4zufyli33oo	2	10:15	12:15	Salle 2
cmw20gu3q001yr4zuj185mwle	cmw20gu1r000ir4zuhz78zu7y	3	08:00	10:00	Salle 1
cmw20gu3q001zr4zu5h1x7g1t	cmw20gu22000sr4zu0cbqfp4o	3	08:00	10:00	Salle 2
cmw20gu3q0020r4zunfd7nnzs	cmw20gu1u000kr4zuynytsn39	3	10:15	12:15	Salle 1
cmw20gu3q0021r4zujbh8ihgs	cmw20gu24000ur4zu1yv21fnq	3	10:15	12:15	Salle 2
cmw20gu3q0022r4zus9ksfmxa	cmw20gu1w000mr4zu6a4acvu0	4	08:00	10:00	Salle 1
cmw20gu3q0023r4zus2wqp1tq	cmw20gu25000wr4zux52jc1w9	4	08:00	10:00	Salle 2
cmw20gu3q0024r4zuip1bfdpg	cmw20gu1y000or4zuxod2ugek	4	10:15	12:15	Salle 1
cmw20gu3q0025r4zudwswvy7j	cmw20gu20000qr4zufyli33oo	4	10:15	12:15	Salle 2
cmw20gu3q0026r4zu4m58gxoz	cmw20gu1r000ir4zuhz78zu7y	5	08:00	10:00	Salle 1
cmw20gu3q0027r4zuchu8hoti	cmw20gu22000sr4zu0cbqfp4o	5	08:00	10:00	Salle 2
cmw20gu3q0028r4zuspm2vpzh	cmw20gu1u000kr4zuynytsn39	5	10:15	12:15	Salle 1
cmw20gu3q0029r4zuiqcvs6od	cmw20gu24000ur4zu1yv21fnq	5	10:15	12:15	Salle 2
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, email, "passwordHash", name, role, active, phone, "photoUrl", sex, "createdAt") FROM stdin;
cmw20gu0t0000r4zup6xnwqre	admin@ecole.mg	$2a$10$ok5V6qgikK77nHcXAkUhh.AT9vUAOE2Z1w6gHS/A6iVg89IS4iue2	Tiana Andrianaivo	ADMIN	t	\N	\N	F	2026-11-04 11:06:02.621
cmw20gu0t0001r4zua2k9fqpu	directeur@ecole.mg	$2a$10$ok5V6qgikK77nHcXAkUhh.AT9vUAOE2Z1w6gHS/A6iVg89IS4iue2	Solofo Rakotomalala	DIRECTOR	t	\N	\N	M	2026-11-04 11:06:02.621
cmw20gu0t0002r4zuounod800	manager@ecole.mg	$2a$10$ok5V6qgikK77nHcXAkUhh.AT9vUAOE2Z1w6gHS/A6iVg89IS4iue2	Naivo Razafindrakoto	MANAGER	t	\N	\N	F	2026-11-04 11:06:02.621
cmw20gu130004r4zupbxrp957	rakoto@ecole.mg	$2a$10$ok5V6qgikK77nHcXAkUhh.AT9vUAOE2Z1w6gHS/A6iVg89IS4iue2	Jean Rakoto	TEACHER	t	\N	\N	M	2026-11-04 11:06:02.631
cmw20gu190006r4zusxtrltak	rasoa@ecole.mg	$2a$10$ok5V6qgikK77nHcXAkUhh.AT9vUAOE2Z1w6gHS/A6iVg89IS4iue2	Marie Rasoa	TEACHER	t	\N	\N	F	2026-11-04 11:06:02.637
cmw20gu1c0008r4zu0t8fmg0y	randrian@ecole.mg	$2a$10$ok5V6qgikK77nHcXAkUhh.AT9vUAOE2Z1w6gHS/A6iVg89IS4iue2	Hery Randrianarisoa	TEACHER	t	\N	\N	M	2026-11-04 11:06:02.64
cmw20gu1f000ar4zujvr9wond	rala@ecole.mg	$2a$10$ok5V6qgikK77nHcXAkUhh.AT9vUAOE2Z1w6gHS/A6iVg89IS4iue2	Voahirana Ralambo	TEACHER	t	\N	\N	F	2026-11-04 11:06:02.643
cmw20gu28000yr4zu03vrn56p	andry@ecole.mg	$2a$10$9NnztllPPVs3H6/Vai9NIOoXtSmwz2OI0.Xg5n/ZSxIQK46dJhcT2	Andry Randria	STUDENT	t	\N	\N	\N	2026-11-04 11:06:02.672
cmw20gu2e0010r4zur6rj9nlr	bodo@ecole.mg	$2a$10$9NnztllPPVs3H6/Vai9NIOoXtSmwz2OI0.Xg5n/ZSxIQK46dJhcT2	Bodo Ravelo	STUDENT	t	\N	\N	\N	2026-11-04 11:06:02.679
cmw20gu2i0012r4zurbtvulro	chloe@ecole.mg	$2a$10$9NnztllPPVs3H6/Vai9NIOoXtSmwz2OI0.Xg5n/ZSxIQK46dJhcT2	Chloé Rakoto	STUDENT	t	\N	\N	\N	2026-11-04 11:06:02.683
cmw20gu2m0014r4zulhl4zgkm	dina@ecole.mg	$2a$10$9NnztllPPVs3H6/Vai9NIOoXtSmwz2OI0.Xg5n/ZSxIQK46dJhcT2	Dina Rasoa	STUDENT	t	\N	\N	\N	2026-11-04 11:06:02.686
cmw20gu2q0016r4zu56iyfhlh	eric@ecole.mg	$2a$10$9NnztllPPVs3H6/Vai9NIOoXtSmwz2OI0.Xg5n/ZSxIQK46dJhcT2	Eric Andrianina	STUDENT	t	\N	\N	\N	2026-11-04 11:06:02.69
cmw20gu2u0018r4zusj3w24yq	faly@ecole.mg	$2a$10$9NnztllPPVs3H6/Vai9NIOoXtSmwz2OI0.Xg5n/ZSxIQK46dJhcT2	Faly Hery	STUDENT	t	\N	\N	\N	2026-11-04 11:06:02.694
cmw20gu2y001ar4zunjic908h	gaby@ecole.mg	$2a$10$9NnztllPPVs3H6/Vai9NIOoXtSmwz2OI0.Xg5n/ZSxIQK46dJhcT2	Gaby Razafy	STUDENT	t	\N	\N	\N	2026-11-04 11:06:02.698
cmw20gu31001cr4zubigvhlld	hery@ecole.mg	$2a$10$9NnztllPPVs3H6/Vai9NIOoXtSmwz2OI0.Xg5n/ZSxIQK46dJhcT2	Hery Ranaivo	STUDENT	t	\N	\N	\N	2026-11-04 11:06:02.701
cmw20gu35001er4zuk9mp7ufx	iony@ecole.mg	$2a$10$9NnztllPPVs3H6/Vai9NIOoXtSmwz2OI0.Xg5n/ZSxIQK46dJhcT2	Iony Rabe	STUDENT	t	\N	\N	\N	2026-11-04 11:06:02.705
cmw20gu38001gr4zuopfrgask	jao@ecole.mg	$2a$10$9NnztllPPVs3H6/Vai9NIOoXtSmwz2OI0.Xg5n/ZSxIQK46dJhcT2	Jao Rakotomalala	STUDENT	t	\N	\N	\N	2026-11-04 11:06:02.709
cmw20gu3f001lr4zuu821dn2f	koto@ecole.mg	$2a$10$9NnztllPPVs3H6/Vai9NIOoXtSmwz2OI0.Xg5n/ZSxIQK46dJhcT2	Koto Rabary	STUDENT	t	\N	\N	\N	2026-11-04 11:06:02.716
cmw20gu3j001nr4zui1sptcse	lala@ecole.mg	$2a$10$9NnztllPPVs3H6/Vai9NIOoXtSmwz2OI0.Xg5n/ZSxIQK46dJhcT2	Lala Rasolofo	STUDENT	t	\N	\N	\N	2026-11-04 11:06:02.719
cmw20gu3m001pr4zuakze9nm4	mika@ecole.mg	$2a$10$9NnztllPPVs3H6/Vai9NIOoXtSmwz2OI0.Xg5n/ZSxIQK46dJhcT2	Mika Andriamanana	STUDENT	t	\N	\N	\N	2026-11-04 11:06:02.722
\.


--
-- Data for Name: UserPhoto; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UserPhoto" ("userId", data, mime, "updatedAt") FROM stdin;
\.


--
-- Name: Announcement Announcement_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Announcement"
    ADD CONSTRAINT "Announcement_pkey" PRIMARY KEY (id);


--
-- Name: Assessment Assessment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Assessment"
    ADD CONSTRAINT "Assessment_pkey" PRIMARY KEY (id);


--
-- Name: Classe Classe_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Classe"
    ADD CONSTRAINT "Classe_pkey" PRIMARY KEY (id);


--
-- Name: Comment Comment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_pkey" PRIMARY KEY (id);


--
-- Name: Course Course_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Course"
    ADD CONSTRAINT "Course_pkey" PRIMARY KEY (id);


--
-- Name: Grade Grade_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Grade"
    ADD CONSTRAINT "Grade_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: Payslip Payslip_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payslip"
    ADD CONSTRAINT "Payslip_pkey" PRIMARY KEY (id);


--
-- Name: Reclamation Reclamation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Reclamation"
    ADD CONSTRAINT "Reclamation_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: StudentAttendance StudentAttendance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."StudentAttendance"
    ADD CONSTRAINT "StudentAttendance_pkey" PRIMARY KEY (id);


--
-- Name: StudentPhoto StudentPhoto_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."StudentPhoto"
    ADD CONSTRAINT "StudentPhoto_pkey" PRIMARY KEY ("studentId");


--
-- Name: Student Student_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Student"
    ADD CONSTRAINT "Student_pkey" PRIMARY KEY (id);


--
-- Name: Subject Subject_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Subject"
    ADD CONSTRAINT "Subject_pkey" PRIMARY KEY (id);


--
-- Name: TeacherAttendance TeacherAttendance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TeacherAttendance"
    ADD CONSTRAINT "TeacherAttendance_pkey" PRIMARY KEY (id);


--
-- Name: Teacher Teacher_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Teacher"
    ADD CONSTRAINT "Teacher_pkey" PRIMARY KEY (id);


--
-- Name: Term Term_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Term"
    ADD CONSTRAINT "Term_pkey" PRIMARY KEY (id);


--
-- Name: TimetableSlot TimetableSlot_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TimetableSlot"
    ADD CONSTRAINT "TimetableSlot_pkey" PRIMARY KEY (id);


--
-- Name: UserPhoto UserPhoto_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserPhoto"
    ADD CONSTRAINT "UserPhoto_pkey" PRIMARY KEY ("userId");


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Announcement_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Announcement_createdAt_idx" ON public."Announcement" USING btree ("createdAt");


--
-- Name: Classe_name_year_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Classe_name_year_key" ON public."Classe" USING btree (name, year);


--
-- Name: Comment_studentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Comment_studentId_idx" ON public."Comment" USING btree ("studentId");


--
-- Name: Comment_teacherId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Comment_teacherId_idx" ON public."Comment" USING btree ("teacherId");


--
-- Name: Course_classeId_subjectId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Course_classeId_subjectId_key" ON public."Course" USING btree ("classeId", "subjectId");


--
-- Name: Course_teacherId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Course_teacherId_idx" ON public."Course" USING btree ("teacherId");


--
-- Name: Grade_assessmentId_studentId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Grade_assessmentId_studentId_key" ON public."Grade" USING btree ("assessmentId", "studentId");


--
-- Name: Notification_dedupeKey_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Notification_dedupeKey_key" ON public."Notification" USING btree ("dedupeKey");


--
-- Name: Notification_userId_readAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Notification_userId_readAt_idx" ON public."Notification" USING btree ("userId", "readAt");


--
-- Name: Payslip_teacherId_month_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Payslip_teacherId_month_key" ON public."Payslip" USING btree ("teacherId", month);


--
-- Name: Reclamation_authorId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Reclamation_authorId_idx" ON public."Reclamation" USING btree ("authorId");


--
-- Name: Reclamation_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Reclamation_status_idx" ON public."Reclamation" USING btree (status);


--
-- Name: Session_courseId_startsAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Session_courseId_startsAt_idx" ON public."Session" USING btree ("courseId", "startsAt");


--
-- Name: Session_teacherId_startsAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Session_teacherId_startsAt_idx" ON public."Session" USING btree ("teacherId", "startsAt");


--
-- Name: StudentAttendance_sessionId_studentId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "StudentAttendance_sessionId_studentId_key" ON public."StudentAttendance" USING btree ("sessionId", "studentId");


--
-- Name: StudentAttendance_studentId_markedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "StudentAttendance_studentId_markedAt_idx" ON public."StudentAttendance" USING btree ("studentId", "markedAt");


--
-- Name: Student_classeId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Student_classeId_idx" ON public."Student" USING btree ("classeId");


--
-- Name: Student_lastName_firstName_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Student_lastName_firstName_idx" ON public."Student" USING btree ("lastName", "firstName");


--
-- Name: Student_matricule_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Student_matricule_key" ON public."Student" USING btree (matricule);


--
-- Name: Student_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Student_userId_key" ON public."Student" USING btree ("userId");


--
-- Name: Subject_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Subject_name_key" ON public."Subject" USING btree (name);


--
-- Name: TeacherAttendance_sessionId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "TeacherAttendance_sessionId_key" ON public."TeacherAttendance" USING btree ("sessionId");


--
-- Name: TeacherAttendance_teacherId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TeacherAttendance_teacherId_idx" ON public."TeacherAttendance" USING btree ("teacherId");


--
-- Name: Teacher_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Teacher_userId_key" ON public."Teacher" USING btree ("userId");


--
-- Name: TimetableSlot_courseId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TimetableSlot_courseId_idx" ON public."TimetableSlot" USING btree ("courseId");


--
-- Name: TimetableSlot_dayOfWeek_startTime_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TimetableSlot_dayOfWeek_startTime_idx" ON public."TimetableSlot" USING btree ("dayOfWeek", "startTime");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: Announcement Announcement_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Announcement"
    ADD CONSTRAINT "Announcement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Assessment Assessment_courseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Assessment"
    ADD CONSTRAINT "Assessment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES public."Course"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Assessment Assessment_termId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Assessment"
    ADD CONSTRAINT "Assessment_termId_fkey" FOREIGN KEY ("termId") REFERENCES public."Term"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Comment Comment_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Comment Comment_sessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES public."Session"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Comment Comment_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public."Student"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Comment Comment_teacherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES public."Teacher"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Course Course_classeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Course"
    ADD CONSTRAINT "Course_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES public."Classe"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Course Course_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Course"
    ADD CONSTRAINT "Course_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES public."Subject"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Course Course_teacherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Course"
    ADD CONSTRAINT "Course_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES public."Teacher"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Grade Grade_assessmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Grade"
    ADD CONSTRAINT "Grade_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES public."Assessment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Grade Grade_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Grade"
    ADD CONSTRAINT "Grade_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public."Student"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Notification Notification_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Payslip Payslip_teacherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payslip"
    ADD CONSTRAINT "Payslip_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES public."Teacher"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Reclamation Reclamation_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Reclamation"
    ADD CONSTRAINT "Reclamation_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Session Session_courseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES public."Course"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Session Session_teacherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES public."Teacher"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StudentAttendance StudentAttendance_sessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."StudentAttendance"
    ADD CONSTRAINT "StudentAttendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES public."Session"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: StudentAttendance StudentAttendance_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."StudentAttendance"
    ADD CONSTRAINT "StudentAttendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public."Student"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StudentPhoto StudentPhoto_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."StudentPhoto"
    ADD CONSTRAINT "StudentPhoto_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public."Student"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Student Student_classeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Student"
    ADD CONSTRAINT "Student_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES public."Classe"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Student Student_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Student"
    ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TeacherAttendance TeacherAttendance_sessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TeacherAttendance"
    ADD CONSTRAINT "TeacherAttendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES public."Session"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TeacherAttendance TeacherAttendance_teacherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TeacherAttendance"
    ADD CONSTRAINT "TeacherAttendance_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES public."Teacher"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Teacher Teacher_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Teacher"
    ADD CONSTRAINT "Teacher_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TimetableSlot TimetableSlot_courseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TimetableSlot"
    ADD CONSTRAINT "TimetableSlot_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES public."Course"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserPhoto UserPhoto_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserPhoto"
    ADD CONSTRAINT "UserPhoto_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict N2I06JAFFBgpBlgB5MdR38nQ6xjCc5ooYX4m7IAsGeWuXWjWK6hfolVGgZeR28g

