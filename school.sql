--
-- PostgreSQL database dump
--

\restrict kbQJX63xz7XoEJ5oRn1JJgcKksRR5klWwQuKMIFICzwvo1ImO3a2zETwYd76B3c

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
-- Name: Nomenclature; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Nomenclature" AS ENUM (
    'NEW',
    'PROMOTED',
    'REPEATER',
    'TRANSFERRED'
);


ALTER TYPE public."Nomenclature" OWNER TO postgres;

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

--
-- Name: school_year_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.school_year_status AS ENUM (
    'UPCOMING',
    'ACTIVE',
    'CLOSED',
    'ARCHIVED'
);


ALTER TYPE public.school_year_status OWNER TO postgres;

--
-- Name: teacher_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.teacher_status AS ENUM (
    'TITULAIRE',
    'CONTRACTUEL',
    'VACATAIRE',
    'PERMANENT',
    'STAGIAIRE'
);


ALTER TYPE public.teacher_status OWNER TO postgres;

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
    nomenclature public."Nomenclature" DEFAULT 'NEW'::public."Nomenclature" NOT NULL,
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
    "hourlyRate" numeric(12,2) NOT NULL,
    status public.teacher_status DEFAULT 'CONTRACTUEL'::public.teacher_status NOT NULL
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
-- Name: classes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.classes (
    id text NOT NULL,
    school_year_id text NOT NULL,
    name character varying(50) NOT NULL,
    room_number character varying(20),
    capacity integer DEFAULT 40,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.classes OWNER TO postgres;

--
-- Name: school_years; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.school_years (
    id text NOT NULL,
    name character varying(20) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    is_current boolean DEFAULT false NOT NULL,
    status public.school_year_status DEFAULT 'UPCOMING'::public.school_year_status NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_dates CHECK ((end_date > start_date))
);


ALTER TABLE public.school_years OWNER TO postgres;

--
-- Name: terms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.terms (
    id text NOT NULL,
    name text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    school_year_id text NOT NULL
);


ALTER TABLE public.terms OWNER TO postgres;

--
-- Data for Name: Announcement; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Announcement" (id, "authorId", title, body, published, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Assessment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Assessment" (id, "courseId", "termId", title, type, "maxScore", coefficient, date) FROM stdin;
cmw38hsk4004ieqns5v7p24gk	cmw38hsgn000meqns9wv8zn9h	cmw38hsk1004geqns8r1rm1re	Interro 1	TEST	20	1	2026-11-02 00:00:00
cmw38hskb004peqns54m595ju	cmw38hsgq000oeqnslgd7sp6q	cmw38hsk1004geqns8r1rm1re	Dictée 1	TEST	20	1	2026-11-02 00:00:00
cmw38hskg004weqnss1zcqxdf	cmw38hsgr000qeqns2t0u5ucv	cmw38hsk1004geqns8r1rm1re	Fanadinana 1	TEST	20	1	2026-11-02 00:00:00
cmw38hskk0053eqnsgcmfycxx	cmw38hsgt000seqnsqbgha8rg	cmw38hsk1004geqns8r1rm1re	Contrôle 1	TEST	20	1	2026-11-02 00:00:00
cmw38hsko005aeqns1ilbijub	cmw38hsgv000ueqns1gc1sckz	cmw38hsk1004geqns8r1rm1re	Interro 1	TEST	20	1	2026-11-02 00:00:00
cmw38hsks005heqns1sg8nzwn	cmw38hsgx000weqns4gc1sgup	cmw38hsk1004geqns8r1rm1re	Dictée 1	TEST	20	1	2026-11-02 00:00:00
cmw38hskw005oeqns1lfunrk8	cmw38hsgy000yeqnsky9c8q57	cmw38hsk1004geqns8r1rm1re	Fanadinana 1	TEST	20	1	2026-11-02 00:00:00
cmw38hsl0005veqnsysg90qwx	cmw38hsh00010eqns5vfp636c	cmw38hsk1004geqns8r1rm1re	Contrôle 1	TEST	20	1	2026-11-02 00:00:00
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
cmw38hsgn000meqns9wv8zn9h	cmw38hsgb000eeqnsr5s0p5lu	cmw38hsgg000heqns9wkydm2m	cmw38hsfr0003eqns7ymvba6h	3
cmw38hsgq000oeqnslgd7sp6q	cmw38hsgb000eeqnsr5s0p5lu	cmw38hsgi000ieqns02hmnnfn	cmw38hsfx0005eqns1jee793p	2
cmw38hsgr000qeqns2t0u5ucv	cmw38hsgb000eeqnsr5s0p5lu	cmw38hsgj000jeqnsfklco1ms	cmw38hsg00007eqnsgnjf0pzs	2
cmw38hsgt000seqnsqbgha8rg	cmw38hsgb000eeqnsr5s0p5lu	cmw38hsgl000keqnsan0byf5x	cmw38hsg30009eqnsrqxm2e2d	1.5
cmw38hsgv000ueqns1gc1sckz	cmw38hsge000geqns8ybw9yw1	cmw38hsgg000heqns9wkydm2m	cmw38hsfr0003eqns7ymvba6h	3
cmw38hsgx000weqns4gc1sgup	cmw38hsge000geqns8ybw9yw1	cmw38hsgi000ieqns02hmnnfn	cmw38hsfx0005eqns1jee793p	2
cmw38hsgy000yeqnsky9c8q57	cmw38hsge000geqns8ybw9yw1	cmw38hsgj000jeqnsfklco1ms	cmw38hsg00007eqnsgnjf0pzs	2
cmw38hsh00010eqns5vfp636c	cmw38hsge000geqns8ybw9yw1	cmw38hsgl000keqnsan0byf5x	cmw38hsg30009eqnsrqxm2e2d	1.5
cmw38hsi7001neqns17n7inrs	cmw38hsi5001meqnssg38ujss	cmw38hsgg000heqns9wkydm2m	cmw38hsfr0003eqns7ymvba6h	3
cmw38hsi7001oeqns4kdm5yy9	cmw38hsi5001meqnssg38ujss	cmw38hsgi000ieqns02hmnnfn	cmw38hsfx0005eqns1jee793p	2
\.


--
-- Data for Name: Grade; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Grade" (id, "assessmentId", "studentId", score, "updatedAt") FROM stdin;
cmw38hsk6004jeqnsntiipfa3	cmw38hsk4004ieqns5v7p24gk	cmw38hsh20011eqns6yeovr4k	8	2026-11-05 07:38:30.487
cmw38hsk6004keqnsiyp9cqrz	cmw38hsk4004ieqns5v7p24gk	cmw38hsh90013eqns0qci8occ	15	2026-11-05 07:38:30.487
cmw38hsk6004leqnsob6ivdl6	cmw38hsk4004ieqns5v7p24gk	cmw38hshc0015eqnsg3o53sir	10	2026-11-05 07:38:30.487
cmw38hsk6004meqns1tie0ncd	cmw38hsk4004ieqns5v7p24gk	cmw38hshg0017eqns4mha1ilg	17	2026-11-05 07:38:30.487
cmw38hsk6004neqnsgf5t6218	cmw38hsk4004ieqns5v7p24gk	cmw38hshk0019eqnsod2semp4	\N	2026-11-05 07:38:30.487
cmw38hskd004qeqnsjjccfaj3	cmw38hskb004peqns54m595ju	cmw38hsh20011eqns6yeovr4k	8	2026-11-05 07:38:30.494
cmw38hskd004reqnsldunil9d	cmw38hskb004peqns54m595ju	cmw38hsh90013eqns0qci8occ	15	2026-11-05 07:38:30.494
cmw38hskd004seqnsigcujzxk	cmw38hskb004peqns54m595ju	cmw38hshc0015eqnsg3o53sir	10	2026-11-05 07:38:30.494
cmw38hskd004teqnspm0pwd0z	cmw38hskb004peqns54m595ju	cmw38hshg0017eqns4mha1ilg	17	2026-11-05 07:38:30.494
cmw38hskd004ueqns6z6xkqrj	cmw38hskb004peqns54m595ju	cmw38hshk0019eqnsod2semp4	\N	2026-11-05 07:38:30.494
cmw38hskh004xeqnsvdz13ggs	cmw38hskg004weqnss1zcqxdf	cmw38hsh20011eqns6yeovr4k	8	2026-11-05 07:38:30.498
cmw38hskh004yeqnsqdiygyif	cmw38hskg004weqnss1zcqxdf	cmw38hsh90013eqns0qci8occ	15	2026-11-05 07:38:30.498
cmw38hskh004zeqnswt297wm0	cmw38hskg004weqnss1zcqxdf	cmw38hshc0015eqnsg3o53sir	10	2026-11-05 07:38:30.498
cmw38hskh0050eqnso8vcznd4	cmw38hskg004weqnss1zcqxdf	cmw38hshg0017eqns4mha1ilg	17	2026-11-05 07:38:30.498
cmw38hskh0051eqnsxd2zz6qu	cmw38hskg004weqnss1zcqxdf	cmw38hshk0019eqnsod2semp4	\N	2026-11-05 07:38:30.498
cmw38hskl0054eqnsc8lntu4j	cmw38hskk0053eqnsgcmfycxx	cmw38hsh20011eqns6yeovr4k	8	2026-11-05 07:38:30.502
cmw38hskm0055eqns94g81sf3	cmw38hskk0053eqnsgcmfycxx	cmw38hsh90013eqns0qci8occ	15	2026-11-05 07:38:30.502
cmw38hskm0056eqnsfcf6nrcb	cmw38hskk0053eqnsgcmfycxx	cmw38hshc0015eqnsg3o53sir	10	2026-11-05 07:38:30.502
cmw38hskm0057eqns7cavc8oy	cmw38hskk0053eqnsgcmfycxx	cmw38hshg0017eqns4mha1ilg	17	2026-11-05 07:38:30.502
cmw38hskm0058eqns5xxi2tog	cmw38hskk0053eqnsgcmfycxx	cmw38hshk0019eqnsod2semp4	\N	2026-11-05 07:38:30.502
cmw38hskp005beqnsped03hrl	cmw38hsko005aeqns1ilbijub	cmw38hsho001beqnskdtnigfy	8	2026-11-05 07:38:30.506
cmw38hskp005ceqnsmwkzurzr	cmw38hsko005aeqns1ilbijub	cmw38hshs001deqnsch2tm98c	15	2026-11-05 07:38:30.506
cmw38hskp005deqns5ijy2ztr	cmw38hsko005aeqns1ilbijub	cmw38hshv001feqnso6ol9j21	10	2026-11-05 07:38:30.506
cmw38hskp005eeqnsa7zkx32y	cmw38hsko005aeqns1ilbijub	cmw38hshz001heqns1tzbap3w	17	2026-11-05 07:38:30.506
cmw38hskp005feqnsjhfnv9fn	cmw38hsko005aeqns1ilbijub	cmw38hsi2001jeqnsokw2ok56	\N	2026-11-05 07:38:30.506
cmw38hsku005ieqnsg48x18ua	cmw38hsks005heqns1sg8nzwn	cmw38hsho001beqnskdtnigfy	8	2026-11-05 07:38:30.51
cmw38hsku005jeqnsdqkl0fxy	cmw38hsks005heqns1sg8nzwn	cmw38hshs001deqnsch2tm98c	15	2026-11-05 07:38:30.51
cmw38hsku005keqnsl0o2x2j1	cmw38hsks005heqns1sg8nzwn	cmw38hshv001feqnso6ol9j21	10	2026-11-05 07:38:30.51
cmw38hsku005leqnsrwvzaeif	cmw38hsks005heqns1sg8nzwn	cmw38hshz001heqns1tzbap3w	17	2026-11-05 07:38:30.51
cmw38hsku005meqns0gv70un9	cmw38hsks005heqns1sg8nzwn	cmw38hsi2001jeqnsokw2ok56	\N	2026-11-05 07:38:30.51
cmw38hskx005peqns26jqo49h	cmw38hskw005oeqns1lfunrk8	cmw38hsho001beqnskdtnigfy	8	2026-11-05 07:38:30.514
cmw38hskx005qeqnsd8j44vd4	cmw38hskw005oeqns1lfunrk8	cmw38hshs001deqnsch2tm98c	15	2026-11-05 07:38:30.514
cmw38hskx005reqnse7hf5cmt	cmw38hskw005oeqns1lfunrk8	cmw38hshv001feqnso6ol9j21	10	2026-11-05 07:38:30.514
cmw38hskx005seqns66dbeqrw	cmw38hskw005oeqns1lfunrk8	cmw38hshz001heqns1tzbap3w	17	2026-11-05 07:38:30.514
cmw38hskx005teqnsv0i3q1k7	cmw38hskw005oeqns1lfunrk8	cmw38hsi2001jeqnsokw2ok56	\N	2026-11-05 07:38:30.514
cmw38hsl2005weqnssa19qsi7	cmw38hsl0005veqnsysg90qwx	cmw38hsho001beqnskdtnigfy	8	2026-11-05 07:38:30.518
cmw38hsl2005xeqnspesmkeui	cmw38hsl0005veqnsysg90qwx	cmw38hshs001deqnsch2tm98c	15	2026-11-05 07:38:30.518
cmw38hsl2005yeqnsfvo2r9a8	cmw38hsl0005veqnsysg90qwx	cmw38hshv001feqnso6ol9j21	10	2026-11-05 07:38:30.518
cmw38hsl2005zeqnsy1a2z4lq	cmw38hsl0005veqnsysg90qwx	cmw38hshz001heqns1tzbap3w	17	2026-11-05 07:38:30.518
cmw38hsl20060eqnsdtqdgns8	cmw38hsl0005veqnsysg90qwx	cmw38hsi2001jeqnsokw2ok56	\N	2026-11-05 07:38:30.518
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Notification" (id, "userId", type, title, body, data, "dedupeKey", "readAt", "createdAt") FROM stdin;
cmw38hsr30061eqnssmclxbjf	cmw38hsfh0000eqnsiva9tul9	STUDENT_LATE_WEEK	Retards fréquents	Andry Randria a accumulé 4 retard(s) cette semaine.	{"count": 4, "studentId": "cmw38hsh20011eqns6yeovr4k"}	STU_LATE:cmw38hsh20011eqns6yeovr4k:2026-11-02:cmw38hsfh0000eqnsiva9tul9	\N	2026-11-05 07:38:30.735
cmw38hsr30062eqnso91won02	cmw38hsfh0001eqnsjd4zre83	STUDENT_LATE_WEEK	Retards fréquents	Andry Randria a accumulé 4 retard(s) cette semaine.	{"count": 4, "studentId": "cmw38hsh20011eqns6yeovr4k"}	STU_LATE:cmw38hsh20011eqns6yeovr4k:2026-11-02:cmw38hsfh0001eqnsjd4zre83	\N	2026-11-05 07:38:30.735
cmw38hsr30063eqnsiom9zzm1	cmw38hsh20012eqns8uhlads5	STUDENT_LATE_WEEK	Retards fréquents	Andry Randria a accumulé 4 retard(s) cette semaine.	{"count": 4, "studentId": "cmw38hsh20011eqns6yeovr4k"}	STU_LATE:cmw38hsh20011eqns6yeovr4k:2026-11-02:cmw38hsh20012eqns8uhlads5	\N	2026-11-05 07:38:30.735
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
cmw38hsiq002ieqnse7iv8ndh	cmw38hsgq000oeqnslgd7sp6q	cmw38hsfx0005eqns1jee793p	2026-11-04 08:00:00	2026-11-04 10:00:00	DONE
cmw38hsis002keqns53qhoh05	cmw38hsgr000qeqns2t0u5ucv	cmw38hsg00007eqnsgnjf0pzs	2026-11-03 08:00:00	2026-11-03 10:00:00	DONE
cmw38hsiu002meqnsxedpampt	cmw38hsgt000seqnsqbgha8rg	cmw38hsg30009eqnsrqxm2e2d	2026-11-02 08:00:00	2026-11-02 10:00:00	DONE
cmw38hsix002qeqnslhjz00vb	cmw38hsgx000weqns4gc1sgup	cmw38hsfx0005eqns1jee793p	2026-10-31 08:00:00	2026-10-31 10:00:00	DONE
cmw38hsiz002seqns8htrq36d	cmw38hsgy000yeqnsky9c8q57	cmw38hsg00007eqnsgnjf0pzs	2026-10-30 08:00:00	2026-10-30 10:00:00	DONE
cmw38hsj0002ueqnsk1pui0lv	cmw38hsh00010eqns5vfp636c	cmw38hsg30009eqnsrqxm2e2d	2026-10-29 08:00:00	2026-10-29 10:00:00	DONE
cmw38hsin002geqnst1o7f34v	cmw38hsgn000meqns9wv8zn9h	cmw38hsfr0003eqns7ymvba6h	2026-11-05 08:00:00	2026-11-05 10:00:00	DONE
cmw38hsiv002oeqns89dh3wmz	cmw38hsgv000ueqns1gc1sckz	cmw38hsfr0003eqns7ymvba6h	2026-11-01 08:00:00	2026-11-01 10:00:00	DONE
\.


--
-- Data for Name: Student; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Student" (id, "userId", matricule, "firstName", "lastName", "birthDate", "birthPlace", sex, address, phone, "parentName", "parentPhone", "photoUrl", "registeredAt", nomenclature, "classeId") FROM stdin;
cmw38hsh20011eqns6yeovr4k	cmw38hsh20012eqns8uhlads5	M26-001	Andry	Randria	2014-01-05 00:00:00	Antananarivo	M	Lot II 10 Antananarivo	+261 34 00 00 01	Parent de Andry	+261 32 11 22 01	\N	2026-10-06 09:00:00	NEW	cmw38hsgb000eeqnsr5s0p5lu
cmw38hsh90013eqns0qci8occ	cmw38hsh90014eqnsjjuz3xor	M26-002	Bodo	Ravelo	2014-02-06 00:00:00	Antananarivo	F	Lot II 11 Antananarivo	+261 34 00 00 02	Parent de Bodo	+261 32 11 22 02	\N	2026-10-07 09:00:00	PROMOTED	cmw38hsgb000eeqnsr5s0p5lu
cmw38hshc0015eqnsg3o53sir	cmw38hshd0016eqnsstctjao6	M26-003	Chloé	Rakoto	2014-03-07 00:00:00	Antananarivo	M	Lot II 12 Antananarivo	+261 34 00 00 03	Parent de Chloé	+261 32 11 22 03	\N	2026-10-08 09:00:00	NEW	cmw38hsgb000eeqnsr5s0p5lu
cmw38hshg0017eqns4mha1ilg	cmw38hshg0018eqns98uns7w9	M26-004	Dina	Rasoa	2014-04-08 00:00:00	Antananarivo	F	Lot II 13 Antananarivo	+261 34 00 00 04	Parent de Dina	+261 32 11 22 04	\N	2026-10-09 09:00:00	REPEATER	cmw38hsgb000eeqnsr5s0p5lu
cmw38hshk0019eqnsod2semp4	cmw38hshk001aeqnssuiuoccz	M26-005	Eric	Andrianina	2014-05-09 00:00:00	Antananarivo	M	Lot II 14 Antananarivo	+261 34 00 00 05	Parent de Eric	+261 32 11 22 05	\N	2026-10-10 09:00:00	TRANSFERRED	cmw38hsgb000eeqnsr5s0p5lu
cmw38hsho001beqnskdtnigfy	cmw38hsho001ceqnsmwk61c6s	M26-006	Faly	Hery	2014-01-05 00:00:00	Antananarivo	M	Lot II 10 Antananarivo	+261 34 00 00 06	Parent de Faly	+261 32 11 22 06	\N	2026-10-06 09:00:00	NEW	cmw38hsge000geqns8ybw9yw1
cmw38hshs001deqnsch2tm98c	cmw38hshs001eeqnsboq74028	M26-007	Gaby	Razafy	2014-02-06 00:00:00	Antananarivo	F	Lot II 11 Antananarivo	+261 34 00 00 07	Parent de Gaby	+261 32 11 22 07	\N	2026-10-07 09:00:00	PROMOTED	cmw38hsge000geqns8ybw9yw1
cmw38hshv001feqnso6ol9j21	cmw38hshv001geqnsf4aj5we2	M26-008	Hery	Ranaivo	2014-03-07 00:00:00	Antananarivo	M	Lot II 12 Antananarivo	+261 34 00 00 08	Parent de Hery	+261 32 11 22 08	\N	2026-10-08 09:00:00	NEW	cmw38hsge000geqns8ybw9yw1
cmw38hshz001heqns1tzbap3w	cmw38hshz001ieqnszqqcpe8k	M26-009	Iony	Rabe	2014-04-08 00:00:00	Antananarivo	F	Lot II 13 Antananarivo	+261 34 00 00 09	Parent de Iony	+261 32 11 22 09	\N	2026-10-09 09:00:00	REPEATER	cmw38hsge000geqns8ybw9yw1
cmw38hsi2001jeqnsokw2ok56	cmw38hsi2001keqnsq2zknok9	M26-010	Jao	Rakotomalala	2014-05-09 00:00:00	Antananarivo	M	Lot II 14 Antananarivo	+261 34 00 00 10	Parent de Jao	+261 32 11 22 10	\N	2026-10-10 09:00:00	TRANSFERRED	cmw38hsge000geqns8ybw9yw1
cmw38hsi9001peqnskvogcxj3	cmw38hsi9001qeqnsu8suon5y	M25-001	Koto	Rabary	2014-01-05 00:00:00	Antananarivo	M	Lot II 10 Antananarivo	+261 34 00 00 01	Parent de Koto	+261 32 11 22 01	\N	2026-10-06 09:00:00	NEW	cmw38hsi5001meqnssg38ujss
cmw38hsic001reqns2d5rk9s3	cmw38hsic001seqns4bwd6egr	M25-002	Lala	Rasolofo	2014-02-06 00:00:00	Antananarivo	F	Lot II 11 Antananarivo	+261 34 00 00 02	Parent de Lala	+261 32 11 22 02	\N	2026-10-07 09:00:00	PROMOTED	cmw38hsi5001meqnssg38ujss
cmw38hsig001teqnsquiiq15v	cmw38hsig001ueqnsbg592iku	M25-003	Mika	Andriamanana	2014-03-07 00:00:00	Antananarivo	M	Lot II 12 Antananarivo	+261 34 00 00 03	Parent de Mika	+261 32 11 22 03	\N	2026-10-08 09:00:00	NEW	cmw38hsi5001meqnssg38ujss
\.


--
-- Data for Name: StudentAttendance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."StudentAttendance" (id, "sessionId", "studentId", status, "minutesLate", note, "markedAt") FROM stdin;
cmw38hsj90032eqns29bruows	cmw38hsiq002ieqnse7iv8ndh	cmw38hsh20011eqns6yeovr4k	LATE	15	\N	2026-11-05 07:38:30.453
cmw38hsj90033eqnsypittc8y	cmw38hsiq002ieqnse7iv8ndh	cmw38hsh90013eqns0qci8occ	ABSENT	0	\N	2026-11-05 07:38:30.453
cmw38hsj90034eqnsnses4fw8	cmw38hsiq002ieqnse7iv8ndh	cmw38hshc0015eqnsg3o53sir	PRESENT	0	\N	2026-11-05 07:38:30.453
cmw38hsj90035eqnsfq88tq3z	cmw38hsiq002ieqnse7iv8ndh	cmw38hshg0017eqns4mha1ilg	PRESENT	0	\N	2026-11-05 07:38:30.453
cmw38hsj90036eqnsc2ox98a2	cmw38hsiq002ieqnse7iv8ndh	cmw38hshk0019eqnsod2semp4	PRESENT	0	\N	2026-11-05 07:38:30.453
cmw38hsjd0039eqns5s0q0xkq	cmw38hsis002keqns53qhoh05	cmw38hsh20011eqns6yeovr4k	LATE	15	\N	2026-11-05 07:38:30.457
cmw38hsjd003aeqnsom54pdct	cmw38hsis002keqns53qhoh05	cmw38hsh90013eqns0qci8occ	ABSENT	0	\N	2026-11-05 07:38:30.457
cmw38hsjd003beqnsn1h8718v	cmw38hsis002keqns53qhoh05	cmw38hshc0015eqnsg3o53sir	PRESENT	0	\N	2026-11-05 07:38:30.457
cmw38hsjd003ceqnsj0qxr7xc	cmw38hsis002keqns53qhoh05	cmw38hshg0017eqns4mha1ilg	PRESENT	0	\N	2026-11-05 07:38:30.457
cmw38hsjd003deqnsk68y0cir	cmw38hsis002keqns53qhoh05	cmw38hshk0019eqnsod2semp4	PRESENT	0	\N	2026-11-05 07:38:30.457
cmw38hsjh003geqnsz6t9paeq	cmw38hsiu002meqnsxedpampt	cmw38hsh20011eqns6yeovr4k	LATE	15	\N	2026-11-05 07:38:30.461
cmw38hsjh003heqnsi7grhmbo	cmw38hsiu002meqnsxedpampt	cmw38hsh90013eqns0qci8occ	ABSENT	0	\N	2026-11-05 07:38:30.461
cmw38hsjh003ieqnstekkuavd	cmw38hsiu002meqnsxedpampt	cmw38hshc0015eqnsg3o53sir	PRESENT	0	\N	2026-11-05 07:38:30.461
cmw38hsjh003jeqnstpvg873w	cmw38hsiu002meqnsxedpampt	cmw38hshg0017eqns4mha1ilg	PRESENT	0	\N	2026-11-05 07:38:30.461
cmw38hsjh003keqns11nw6ndz	cmw38hsiu002meqnsxedpampt	cmw38hshk0019eqnsod2semp4	PRESENT	0	\N	2026-11-05 07:38:30.461
cmw38hsjp003ueqnsqvf4fbpp	cmw38hsix002qeqnslhjz00vb	cmw38hsho001beqnskdtnigfy	PRESENT	0	\N	2026-11-05 07:38:30.469
cmw38hsjp003veqns6yi00sow	cmw38hsix002qeqnslhjz00vb	cmw38hshs001deqnsch2tm98c	ABSENT	0	\N	2026-11-05 07:38:30.469
cmw38hsjp003weqns9esqb707	cmw38hsix002qeqnslhjz00vb	cmw38hshv001feqnso6ol9j21	PRESENT	0	\N	2026-11-05 07:38:30.469
cmw38hsjp003xeqnsig309d5f	cmw38hsix002qeqnslhjz00vb	cmw38hshz001heqns1tzbap3w	PRESENT	0	\N	2026-11-05 07:38:30.469
cmw38hsjp003yeqns63wzjyx7	cmw38hsix002qeqnslhjz00vb	cmw38hsi2001jeqnsokw2ok56	PRESENT	0	\N	2026-11-05 07:38:30.469
cmw38hsjt0041eqnsomd3utqk	cmw38hsiz002seqns8htrq36d	cmw38hsho001beqnskdtnigfy	PRESENT	0	\N	2026-11-05 07:38:30.474
cmw38hsjt0042eqns77hw1yyy	cmw38hsiz002seqns8htrq36d	cmw38hshs001deqnsch2tm98c	ABSENT	0	\N	2026-11-05 07:38:30.474
cmw38hsjt0043eqns70eshasb	cmw38hsiz002seqns8htrq36d	cmw38hshv001feqnso6ol9j21	PRESENT	0	\N	2026-11-05 07:38:30.474
cmw38hsjt0044eqnso7isnudy	cmw38hsiz002seqns8htrq36d	cmw38hshz001heqns1tzbap3w	PRESENT	0	\N	2026-11-05 07:38:30.474
cmw38hsjt0045eqnsjghl34a9	cmw38hsiz002seqns8htrq36d	cmw38hsi2001jeqnsokw2ok56	PRESENT	0	\N	2026-11-05 07:38:30.474
cmw38hsjx0048eqnse5xv90ty	cmw38hsj0002ueqnsk1pui0lv	cmw38hsho001beqnskdtnigfy	PRESENT	0	\N	2026-11-05 07:38:30.478
cmw38hsjx0049eqns0asnthgj	cmw38hsj0002ueqnsk1pui0lv	cmw38hshs001deqnsch2tm98c	ABSENT	0	\N	2026-11-05 07:38:30.478
cmw38hsjx004aeqnsr1b6b5ya	cmw38hsj0002ueqnsk1pui0lv	cmw38hshv001feqnso6ol9j21	PRESENT	0	\N	2026-11-05 07:38:30.478
cmw38hsjx004beqns6do6qs70	cmw38hsj0002ueqnsk1pui0lv	cmw38hshz001heqns1tzbap3w	PRESENT	0	\N	2026-11-05 07:38:30.478
cmw38hsjx004ceqnsk9od86zt	cmw38hsj0002ueqnsk1pui0lv	cmw38hsi2001jeqnsokw2ok56	PRESENT	0	\N	2026-11-05 07:38:30.478
cmw38hsj2002veqnsi121njjq	cmw38hsin002geqnst1o7f34v	cmw38hsh20011eqns6yeovr4k	LATE	15	\N	2026-11-05 07:38:30.446
cmw38hsj2002weqnsp1pd67f1	cmw38hsin002geqnst1o7f34v	cmw38hsh90013eqns0qci8occ	ABSENT	0	\N	2026-11-05 07:38:30.446
cmw38hsj2002xeqnsoyjjnrv6	cmw38hsin002geqnst1o7f34v	cmw38hshc0015eqnsg3o53sir	PRESENT	0	\N	2026-11-05 07:38:30.446
cmw38hsj2002yeqnst4bsu5pu	cmw38hsin002geqnst1o7f34v	cmw38hshg0017eqns4mha1ilg	PRESENT	0	\N	2026-11-05 07:38:30.446
cmw38hsj2002zeqns8psxo8hd	cmw38hsin002geqnst1o7f34v	cmw38hshk0019eqnsod2semp4	PRESENT	0	\N	2026-11-05 07:38:30.446
cmw38hsjl003neqnsyeyufzx4	cmw38hsiv002oeqns89dh3wmz	cmw38hsho001beqnskdtnigfy	PRESENT	0	\N	2026-11-05 07:38:30.465
cmw38hsjl003oeqns44f5bdtu	cmw38hsiv002oeqns89dh3wmz	cmw38hshs001deqnsch2tm98c	ABSENT	0	\N	2026-11-05 07:38:30.465
cmw38hsjl003peqnsgyo7iloe	cmw38hsiv002oeqns89dh3wmz	cmw38hshv001feqnso6ol9j21	PRESENT	0	\N	2026-11-05 07:38:30.465
cmw38hsjl003qeqnspkoi88lr	cmw38hsiv002oeqns89dh3wmz	cmw38hshz001heqns1tzbap3w	PRESENT	0	\N	2026-11-05 07:38:30.465
cmw38hsjl003reqns8ds0o89k	cmw38hsiv002oeqns89dh3wmz	cmw38hsi2001jeqnsokw2ok56	PRESENT	0	\N	2026-11-05 07:38:30.465
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
cmw38hsgg000heqns9wkydm2m	Mathématiques
cmw38hsgi000ieqns02hmnnfn	Français
cmw38hsgj000jeqnsfklco1ms	Malagasy
cmw38hsgl000keqnsan0byf5x	Histoire
\.


--
-- Data for Name: Teacher; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Teacher" (id, "userId", "hourlyRate", status) FROM stdin;
cmw38hsfr0003eqns7ymvba6h	cmw38hsfr0004eqns83icwev8	8000.00	TITULAIRE
cmw38hsfx0005eqns1jee793p	cmw38hsfx0006eqnsi69qu1sn	9000.00	PERMANENT
cmw38hsg00007eqnsgnjf0pzs	cmw38hsg00008eqnsheg60x3r	8500.00	CONTRACTUEL
cmw38hsg30009eqnsrqxm2e2d	cmw38hsg3000aeqns7fqlexhv	8200.00	VACATAIRE
\.


--
-- Data for Name: TeacherAttendance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TeacherAttendance" (id, "sessionId", "teacherId", status, "arrivedAt", "leftAt", note) FROM stdin;
cmw38hsj60031eqnssh33xqzc	cmw38hsin002geqnst1o7f34v	cmw38hsfr0003eqns7ymvba6h	PRESENT	\N	\N	\N
cmw38hsjb0038eqnsflhb233k	cmw38hsiq002ieqnse7iv8ndh	cmw38hsfx0005eqns1jee793p	LATE	2026-11-04 08:20:00	\N	\N
cmw38hsjf003feqnspdj0fw6p	cmw38hsis002keqns53qhoh05	cmw38hsg00007eqnsgnjf0pzs	PRESENT	\N	\N	\N
cmw38hsjj003meqnsel94vu0a	cmw38hsiu002meqnsxedpampt	cmw38hsg30009eqnsrqxm2e2d	PRESENT	\N	\N	\N
cmw38hsjn003teqns5e574x35	cmw38hsiv002oeqns89dh3wmz	cmw38hsfr0003eqns7ymvba6h	PRESENT	\N	\N	\N
cmw38hsjr0040eqnsak466oag	cmw38hsix002qeqnslhjz00vb	cmw38hsfx0005eqns1jee793p	LATE	2026-10-31 08:20:00	\N	\N
cmw38hsjw0047eqnsyvwbnctd	cmw38hsiz002seqns8htrq36d	cmw38hsg00007eqnsgnjf0pzs	PRESENT	\N	\N	\N
cmw38hsjz004eeqnswq7dp6ql	cmw38hsj0002ueqnsk1pui0lv	cmw38hsg30009eqnsrqxm2e2d	PRESENT	\N	\N	\N
\.


--
-- Data for Name: TimetableSlot; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TimetableSlot" (id, "courseId", "dayOfWeek", "startTime", "endTime", room) FROM stdin;
cmw38hsij001veqns0n8yx202	cmw38hsgn000meqns9wv8zn9h	1	08:00	10:00	Salle 1
cmw38hsij001weqnsuu6b3t5c	cmw38hsgx000weqns4gc1sgup	1	08:00	10:00	Salle 2
cmw38hsij001xeqnskh7id7j3	cmw38hsgq000oeqnslgd7sp6q	1	10:15	12:15	Salle 1
cmw38hsij001yeqns8p1rctze	cmw38hsgy000yeqnsky9c8q57	1	10:15	12:15	Salle 2
cmw38hsij001zeqnsuxdftocp	cmw38hsgr000qeqns2t0u5ucv	2	08:00	10:00	Salle 1
cmw38hsij0020eqnsbmv0znuy	cmw38hsh00010eqns5vfp636c	2	08:00	10:00	Salle 2
cmw38hsij0021eqns848f8yir	cmw38hsgt000seqnsqbgha8rg	2	10:15	12:15	Salle 1
cmw38hsik0022eqnspuubigae	cmw38hsgv000ueqns1gc1sckz	2	10:15	12:15	Salle 2
cmw38hsik0023eqnsdjg9j0xs	cmw38hsgn000meqns9wv8zn9h	3	08:00	10:00	Salle 1
cmw38hsik0024eqnsrgr0vhkd	cmw38hsgx000weqns4gc1sgup	3	08:00	10:00	Salle 2
cmw38hsik0025eqnsnzrf28li	cmw38hsgq000oeqnslgd7sp6q	3	10:15	12:15	Salle 1
cmw38hsik0026eqnsar5jlqot	cmw38hsgy000yeqnsky9c8q57	3	10:15	12:15	Salle 2
cmw38hsik0027eqns9wi5k5c7	cmw38hsgr000qeqns2t0u5ucv	4	08:00	10:00	Salle 1
cmw38hsik0028eqns8zct9sha	cmw38hsh00010eqns5vfp636c	4	08:00	10:00	Salle 2
cmw38hsik0029eqnsax4g6r6i	cmw38hsgt000seqnsqbgha8rg	4	10:15	12:15	Salle 1
cmw38hsik002aeqns0acvai3f	cmw38hsgv000ueqns1gc1sckz	4	10:15	12:15	Salle 2
cmw38hsik002beqnsgct8ca2k	cmw38hsgn000meqns9wv8zn9h	5	08:00	10:00	Salle 1
cmw38hsik002ceqnsn0gscb23	cmw38hsgx000weqns4gc1sgup	5	08:00	10:00	Salle 2
cmw38hsik002deqnsj56967g1	cmw38hsgq000oeqnslgd7sp6q	5	10:15	12:15	Salle 1
cmw38hsik002eeqnsz9f2xivb	cmw38hsgy000yeqnsky9c8q57	5	10:15	12:15	Salle 2
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, email, "passwordHash", name, role, active, phone, "photoUrl", sex, "createdAt") FROM stdin;
cmw38hsfh0000eqnsiva9tul9	admin@ecole.mg	$2a$10$VzQt8FLw/ulz6B7Q9KHmcekf1eQp3Ajf6T9Cltk/JNfmnUn9txZbi	Tiana Andrianaivo	ADMIN	t	\N	\N	F	2026-11-05 07:38:30.317
cmw38hsfh0001eqnsjd4zre83	directeur@ecole.mg	$2a$10$VzQt8FLw/ulz6B7Q9KHmcekf1eQp3Ajf6T9Cltk/JNfmnUn9txZbi	Solofo Rakotomalala	DIRECTOR	t	\N	\N	M	2026-11-05 07:38:30.317
cmw38hsfh0002eqnsnozj41p7	manager@ecole.mg	$2a$10$VzQt8FLw/ulz6B7Q9KHmcekf1eQp3Ajf6T9Cltk/JNfmnUn9txZbi	Naivo Razafindrakoto	MANAGER	t	\N	\N	F	2026-11-05 07:38:30.317
cmw38hsfr0004eqns83icwev8	rakoto@ecole.mg	$2a$10$VzQt8FLw/ulz6B7Q9KHmcekf1eQp3Ajf6T9Cltk/JNfmnUn9txZbi	Jean Rakoto	TEACHER	t	+261 34 11 111 11	\N	M	2026-11-05 07:38:30.327
cmw38hsfx0006eqnsi69qu1sn	rasoa@ecole.mg	$2a$10$VzQt8FLw/ulz6B7Q9KHmcekf1eQp3Ajf6T9Cltk/JNfmnUn9txZbi	Marie Rasoa	TEACHER	t	+261 34 22 222 22	\N	F	2026-11-05 07:38:30.333
cmw38hsg00008eqnsheg60x3r	randrian@ecole.mg	$2a$10$VzQt8FLw/ulz6B7Q9KHmcekf1eQp3Ajf6T9Cltk/JNfmnUn9txZbi	Hery Randrianarisoa	TEACHER	t	+261 34 33 333 33	\N	M	2026-11-05 07:38:30.337
cmw38hsg3000aeqns7fqlexhv	rala@ecole.mg	$2a$10$VzQt8FLw/ulz6B7Q9KHmcekf1eQp3Ajf6T9Cltk/JNfmnUn9txZbi	Voahirana Ralambo	TEACHER	t	+261 34 44 444 44	\N	F	2026-11-05 07:38:30.34
cmw38hsh20012eqns8uhlads5	andry@ecole.mg	$2a$10$a9NZ0U2oMXpVP42fYgCjguYOcN3EpEewSQqnD70ApZiIC08VdghQ2	Andry Randria	STUDENT	t	\N	\N	\N	2026-11-05 07:38:30.374
cmw38hsh90014eqnsjjuz3xor	bodo@ecole.mg	$2a$10$a9NZ0U2oMXpVP42fYgCjguYOcN3EpEewSQqnD70ApZiIC08VdghQ2	Bodo Ravelo	STUDENT	t	\N	\N	\N	2026-11-05 07:38:30.381
cmw38hshd0016eqnsstctjao6	chloe@ecole.mg	$2a$10$a9NZ0U2oMXpVP42fYgCjguYOcN3EpEewSQqnD70ApZiIC08VdghQ2	Chloé Rakoto	STUDENT	t	\N	\N	\N	2026-11-05 07:38:30.385
cmw38hshg0018eqns98uns7w9	dina@ecole.mg	$2a$10$a9NZ0U2oMXpVP42fYgCjguYOcN3EpEewSQqnD70ApZiIC08VdghQ2	Dina Rasoa	STUDENT	t	\N	\N	\N	2026-11-05 07:38:30.389
cmw38hshk001aeqnssuiuoccz	eric@ecole.mg	$2a$10$a9NZ0U2oMXpVP42fYgCjguYOcN3EpEewSQqnD70ApZiIC08VdghQ2	Eric Andrianina	STUDENT	t	\N	\N	\N	2026-11-05 07:38:30.392
cmw38hsho001ceqnsmwk61c6s	faly@ecole.mg	$2a$10$a9NZ0U2oMXpVP42fYgCjguYOcN3EpEewSQqnD70ApZiIC08VdghQ2	Faly Hery	STUDENT	t	\N	\N	\N	2026-11-05 07:38:30.396
cmw38hshs001eeqnsboq74028	gaby@ecole.mg	$2a$10$a9NZ0U2oMXpVP42fYgCjguYOcN3EpEewSQqnD70ApZiIC08VdghQ2	Gaby Razafy	STUDENT	t	\N	\N	\N	2026-11-05 07:38:30.4
cmw38hshv001geqnsf4aj5we2	hery@ecole.mg	$2a$10$a9NZ0U2oMXpVP42fYgCjguYOcN3EpEewSQqnD70ApZiIC08VdghQ2	Hery Ranaivo	STUDENT	t	\N	\N	\N	2026-11-05 07:38:30.403
cmw38hshz001ieqnszqqcpe8k	iony@ecole.mg	$2a$10$a9NZ0U2oMXpVP42fYgCjguYOcN3EpEewSQqnD70ApZiIC08VdghQ2	Iony Rabe	STUDENT	t	\N	\N	\N	2026-11-05 07:38:30.407
cmw38hsi2001keqnsq2zknok9	jao@ecole.mg	$2a$10$a9NZ0U2oMXpVP42fYgCjguYOcN3EpEewSQqnD70ApZiIC08VdghQ2	Jao Rakotomalala	STUDENT	t	\N	\N	\N	2026-11-05 07:38:30.41
cmw38hsi9001qeqnsu8suon5y	koto@ecole.mg	$2a$10$a9NZ0U2oMXpVP42fYgCjguYOcN3EpEewSQqnD70ApZiIC08VdghQ2	Koto Rabary	STUDENT	t	\N	\N	\N	2026-11-05 07:38:30.417
cmw38hsic001seqns4bwd6egr	lala@ecole.mg	$2a$10$a9NZ0U2oMXpVP42fYgCjguYOcN3EpEewSQqnD70ApZiIC08VdghQ2	Lala Rasolofo	STUDENT	t	\N	\N	\N	2026-11-05 07:38:30.421
cmw38hsig001ueqnsbg592iku	mika@ecole.mg	$2a$10$a9NZ0U2oMXpVP42fYgCjguYOcN3EpEewSQqnD70ApZiIC08VdghQ2	Mika Andriamanana	STUDENT	t	\N	\N	\N	2026-11-05 07:38:30.424
\.


--
-- Data for Name: UserPhoto; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UserPhoto" ("userId", data, mime, "updatedAt") FROM stdin;
\.


--
-- Data for Name: classes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.classes (id, school_year_id, name, room_number, capacity, created_at, updated_at) FROM stdin;
cmw38hsgb000eeqnsr5s0p5lu	cmw38hsg7000beqnsbbq4rrh5	6ème A	Salle 1	40	2026-11-05 10:38:30.348+03	2026-11-05 10:38:30.348+03
cmw38hsge000geqns8ybw9yw1	cmw38hsg7000beqnsbbq4rrh5	5ème B	Salle 2	40	2026-11-05 10:38:30.351+03	2026-11-05 10:38:30.351+03
cmw38hsi5001meqnssg38ujss	cmw38hsga000ceqnsc79ck7od	6ème A	Salle 1	40	2026-11-05 10:38:30.414+03	2026-11-05 10:38:30.414+03
\.


--
-- Data for Name: school_years; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.school_years (id, name, start_date, end_date, is_current, status, created_at, updated_at) FROM stdin;
cmw38hsg7000beqnsbbq4rrh5	2026-2027	2026-09-01	2027-07-15	t	ACTIVE	2026-11-05 10:38:30.343+03	2026-11-05 10:38:30.343+03
cmw38hsga000ceqnsc79ck7od	2025-2026	2025-09-01	2026-07-15	f	CLOSED	2026-11-05 10:38:30.346+03	2026-11-05 10:38:30.346+03
\.


--
-- Data for Name: terms; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.terms (id, name, "startDate", "endDate", school_year_id) FROM stdin;
cmw38hsk1004geqns8r1rm1re	Trimestre 1	2026-09-06 00:00:00	2027-01-04 00:00:00	cmw38hsg7000beqnsbbq4rrh5
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
-- Name: classes classes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_pkey PRIMARY KEY (id);


--
-- Name: school_years school_years_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.school_years
    ADD CONSTRAINT school_years_pkey PRIMARY KEY (id);


--
-- Name: terms terms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.terms
    ADD CONSTRAINT terms_pkey PRIMARY KEY (id);


--
-- Name: Announcement_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Announcement_createdAt_idx" ON public."Announcement" USING btree ("createdAt");


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
-- Name: idx_classes_school_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_classes_school_year ON public.classes USING btree (school_year_id);


--
-- Name: idx_current_school_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_current_school_year ON public.school_years USING btree (is_current) WHERE (is_current = true);


--
-- Name: school_years_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX school_years_name_key ON public.school_years USING btree (name);


--
-- Name: terms_school_year_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX terms_school_year_id_idx ON public.terms USING btree (school_year_id);


--
-- Name: uq_class_per_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_class_per_year ON public.classes USING btree (school_year_id, name);


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
    ADD CONSTRAINT "Assessment_termId_fkey" FOREIGN KEY ("termId") REFERENCES public.terms(id) ON UPDATE CASCADE ON DELETE RESTRICT;


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
    ADD CONSTRAINT "Course_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES public.classes(id) ON UPDATE CASCADE ON DELETE RESTRICT;


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
    ADD CONSTRAINT "Student_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES public.classes(id) ON UPDATE CASCADE ON DELETE RESTRICT;


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
-- Name: classes classes_school_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_school_year_id_fkey FOREIGN KEY (school_year_id) REFERENCES public.school_years(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: terms terms_school_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.terms
    ADD CONSTRAINT terms_school_year_id_fkey FOREIGN KEY (school_year_id) REFERENCES public.school_years(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict kbQJX63xz7XoEJ5oRn1JJgcKksRR5klWwQuKMIFICzwvo1ImO3a2zETwYd76B3c

