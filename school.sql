--
-- PostgreSQL database dump
--

\restrict 4aOQo4iKhb14GiNxN4gQyoqp64ZXkfFuEtum9iJaB1INd3xVTvFAh1orBf5xjcS

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
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    name text NOT NULL,
    role public."Role" NOT NULL,
    active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Data for Name: Announcement; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Announcement" (id, "authorId", title, body, published, "createdAt", "updatedAt") FROM stdin;
cmvzdsj3s0006yxu9zoai91m7	cmvyzfuza0000zttel91xnrrd	Ho any Mpianatra rehetra	Ny talala 03 Novambra izao isika no miditra. 08ora ny fidirana	t	2026-11-02 14:55:44.824	2026-11-02 14:55:44.824
\.


--
-- Data for Name: Assessment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Assessment" (id, "courseId", "termId", title, type, "maxScore", coefficient, date) FROM stdin;
cmvyzfv3t0042ztter4xfoid6	cmvyzfv090009ztte6jbxcq55	cmvyzfv3r0040zttewjnktxlm	Interro 1	TEST	20	1	2026-10-30 00:00:00
cmvyzfv3y004ezttebdw8hkxt	cmvyzfv0d000bztteu9gr1qpe	cmvyzfv3r0040zttewjnktxlm	Dictée 1	TEST	20	1	2026-10-30 00:00:00
\.


--
-- Data for Name: Classe; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Classe" (id, name, year) FROM stdin;
cmvyzfv030005ztteij3n5olv	6ème A	2026-2027
cmvz1luf200003sho478hv6ac	4eme A	2026-2027
cmvz1mpwh00013sho96emyhp9	5eme A	2026-2027
cmvz1n33000023shoarvcrl8l	3eme A	2026-2027
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
cmvyzfv090009ztte6jbxcq55	cmvyzfv030005ztteij3n5olv	cmvyzfv050006ztteqt8m3ash	cmvyzfuzo0001zttermxozw9e	3
cmvyzfv0d000bztteu9gr1qpe	cmvyzfv030005ztteij3n5olv	cmvyzfv070007zttej8sqa7tk	cmvyzfuzz0003ztte1wyqodzm	2
cmvz1nle200043shoe02onccp	cmvz1n33000023shoarvcrl8l	cmvyzruvh0002epmimu4d2rsv	cmvyzfuzo0001zttermxozw9e	1
cmvzc0cds0001xqbg10gilq6z	cmvz1n33000023shoarvcrl8l	cmvyzfv070007zttej8sqa7tk	cmvyzfuzo0001zttermxozw9e	1
\.


--
-- Data for Name: Grade; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Grade" (id, "assessmentId", "studentId", score, "updatedAt") FROM stdin;
cmvyzfv3v0043zttew5eg6ghw	cmvyzfv3t0042ztter4xfoid6	cmvyzfv0g000cztte5m5c431s	8	2026-11-02 08:13:59.228
cmvyzfv3v0044zttex3zh1gvi	cmvyzfv3t0042ztter4xfoid6	cmvyzfv0n000eztteo67wygej	15	2026-11-02 08:13:59.228
cmvyzfv3v0045zttexwntr067	cmvyzfv3t0042ztter4xfoid6	cmvyzfv0t000gzttek8qsqyjj	10	2026-11-02 08:13:59.228
cmvyzfv3v0046zttenz12wurc	cmvyzfv3t0042ztter4xfoid6	cmvyzfv0x000iztteda8zx3n4	17	2026-11-02 08:13:59.228
cmvyzfv3v0047ztteagkda16y	cmvyzfv3t0042ztter4xfoid6	cmvyzfv12000kztte65rwntv6	12	2026-11-02 08:13:59.228
cmvyzfv3v0048zttejuy74u1f	cmvyzfv3t0042ztter4xfoid6	cmvyzfv16000mztte09liwvf4	19	2026-11-02 08:13:59.228
cmvyzfv3v0049zttewic8zqqq	cmvyzfv3t0042ztter4xfoid6	cmvyzfv1b000ozttet72vj07i	14	2026-11-02 08:13:59.228
cmvyzfv3v004aztte128g6vwi	cmvyzfv3t0042ztter4xfoid6	cmvyzfv1f000qzttep2y7iefp	9	2026-11-02 08:13:59.228
cmvyzfv3v004bzttew872hhwb	cmvyzfv3t0042ztter4xfoid6	cmvyzfv1i000szttegzduqxo0	16	2026-11-02 08:13:59.228
cmvyzfv3v004czttezoddbume	cmvyzfv3t0042ztter4xfoid6	cmvyzfv1m000uztteclw6s589	\N	2026-11-02 08:13:59.228
cmvyzfv40004fztte2etcwcmx	cmvyzfv3y004ezttebdw8hkxt	cmvyzfv0g000cztte5m5c431s	8	2026-11-02 08:13:59.232
cmvyzfv40004gztteu87zch8f	cmvyzfv3y004ezttebdw8hkxt	cmvyzfv0n000eztteo67wygej	15	2026-11-02 08:13:59.232
cmvyzfv40004hzttexn0caxki	cmvyzfv3y004ezttebdw8hkxt	cmvyzfv0t000gzttek8qsqyjj	10	2026-11-02 08:13:59.232
cmvyzfv40004izttewxl22a9t	cmvyzfv3y004ezttebdw8hkxt	cmvyzfv0x000iztteda8zx3n4	17	2026-11-02 08:13:59.232
cmvyzfv40004jzttewviqldc6	cmvyzfv3y004ezttebdw8hkxt	cmvyzfv12000kztte65rwntv6	12	2026-11-02 08:13:59.232
cmvyzfv40004kztte0qlgt6xc	cmvyzfv3y004ezttebdw8hkxt	cmvyzfv16000mztte09liwvf4	19	2026-11-02 08:13:59.232
cmvyzfv40004lzttem4d639lo	cmvyzfv3y004ezttebdw8hkxt	cmvyzfv1b000ozttet72vj07i	14	2026-11-02 08:13:59.232
cmvyzfv40004mztteobj3tv8t	cmvyzfv3y004ezttebdw8hkxt	cmvyzfv1f000qzttep2y7iefp	9	2026-11-02 08:13:59.232
cmvyzfv40004nzttet8ghzzqf	cmvyzfv3y004ezttebdw8hkxt	cmvyzfv1i000szttegzduqxo0	16	2026-11-02 08:13:59.232
cmvyzfv40004oztte3wf0eerp	cmvyzfv3y004ezttebdw8hkxt	cmvyzfv1m000uztteclw6s589	\N	2026-11-02 08:13:59.232
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Notification" (id, "userId", type, title, body, data, "dedupeKey", "readAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: Payslip; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Payslip" (id, "teacherId", month, "totalMinutes", "hourlyRate", gross, status, "createdAt") FROM stdin;
cmvzc1mee0005xqbg5ggnqfpq	cmvyzfuzz0003ztte1wyqodzm	2026-11	100	9000.00	15000.00	DRAFT	2026-11-02 14:06:49.766
cmvzc1mdv0003xqbgpo9ldlgp	cmvyzfuzo0001zttermxozw9e	2026-11	120	8000.00	16000.00	DRAFT	2026-11-02 14:06:49.748
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
cmvyzfv1q000xzttej94trxn5	cmvyzfv090009ztte6jbxcq55	cmvyzfuzo0001zttermxozw9e	2026-11-02 08:00:00	2026-11-02 10:00:00	DONE
cmvyzfv1t000zztte8k4sifq3	cmvyzfv0d000bztteu9gr1qpe	cmvyzfuzz0003ztte1wyqodzm	2026-11-01 08:00:00	2026-11-01 10:00:00	DONE
cmvyzfv1w0011zttefr7opj73	cmvyzfv090009ztte6jbxcq55	cmvyzfuzo0001zttermxozw9e	2026-10-31 08:00:00	2026-10-31 10:00:00	DONE
cmvyzfv1x0013zttewyv9vlmx	cmvyzfv0d000bztteu9gr1qpe	cmvyzfuzz0003ztte1wyqodzm	2026-10-30 08:00:00	2026-10-30 10:00:00	DONE
cmvyzfv1z0015ztteq6k5zbg5	cmvyzfv090009ztte6jbxcq55	cmvyzfuzo0001zttermxozw9e	2026-10-29 08:00:00	2026-10-29 10:00:00	DONE
cmvyzfv210017ztte2p7fhwyb	cmvyzfv0d000bztteu9gr1qpe	cmvyzfuzz0003ztte1wyqodzm	2026-10-28 08:00:00	2026-10-28 10:00:00	DONE
cmvyzfv230019zttetcz4fifr	cmvyzfv090009ztte6jbxcq55	cmvyzfuzo0001zttermxozw9e	2026-10-27 08:00:00	2026-10-27 10:00:00	DONE
cmvyzfv25001bztteq2jc6y1s	cmvyzfv0d000bztteu9gr1qpe	cmvyzfuzz0003ztte1wyqodzm	2026-10-26 08:00:00	2026-10-26 10:00:00	DONE
\.


--
-- Data for Name: Student; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Student" (id, "userId", matricule, "firstName", "lastName", "birthDate", "birthPlace", sex, address, phone, "parentName", "parentPhone", "photoUrl", "registeredAt", "classeId") FROM stdin;
cmvyzfv0g000cztte5m5c431s	cmvyzfv0g000dztten6ece593	M26-001	Andry	Randria	2014-01-05 00:00:00	Antananarivo	M	Lot II 10 Antananarivo	+261 34 00 00 00	Parent de Andry	+261 32 11 22 00	\N	2026-10-03 09:00:00	cmvyzfv030005ztteij3n5olv
cmvyzfv0n000eztteo67wygej	cmvyzfv0n000fztteli5b294i	M26-002	Bodo	Ravelo	2014-02-06 00:00:00	Antananarivo	F	Lot II 11 Antananarivo	+261 34 00 00 01	Parent de Bodo	+261 32 11 22 01	\N	2026-10-04 09:00:00	cmvyzfv030005ztteij3n5olv
cmvyzfv0t000gzttek8qsqyjj	cmvyzfv0t000hzttegcyxiq9r	M26-003	Chloé	Rakoto	2014-03-07 00:00:00	Antananarivo	M	Lot II 12 Antananarivo	+261 34 00 00 02	Parent de Chloé	+261 32 11 22 02	\N	2026-10-05 09:00:00	cmvyzfv030005ztteij3n5olv
cmvyzfv0x000iztteda8zx3n4	cmvyzfv0x000jzttey3gbdhvb	M26-004	Dina	Rasoa	2014-04-08 00:00:00	Antananarivo	F	Lot II 13 Antananarivo	+261 34 00 00 03	Parent de Dina	+261 32 11 22 03	\N	2026-10-06 09:00:00	cmvyzfv030005ztteij3n5olv
cmvyzfv12000kztte65rwntv6	cmvyzfv12000lzttevlwrbkwp	M26-005	Eric	Andrianina	2014-05-09 00:00:00	Antananarivo	M	Lot II 14 Antananarivo	+261 34 00 00 04	Parent de Eric	+261 32 11 22 04	\N	2026-10-07 09:00:00	cmvyzfv030005ztteij3n5olv
cmvyzfv16000mztte09liwvf4	cmvyzfv17000nzttea45nasii	M26-006	Faly	Hery	2014-06-10 00:00:00	Antananarivo	F	Lot II 15 Antananarivo	+261 34 00 00 05	Parent de Faly	+261 32 11 22 05	\N	2026-10-08 09:00:00	cmvyzfv030005ztteij3n5olv
cmvyzfv1b000ozttet72vj07i	cmvyzfv1b000pztte5uwl381c	M26-007	Gaby	Razafy	2014-07-11 00:00:00	Antananarivo	M	Lot II 16 Antananarivo	+261 34 00 00 06	Parent de Gaby	+261 32 11 22 06	\N	2026-10-09 09:00:00	cmvyzfv030005ztteij3n5olv
cmvyzfv1f000qzttep2y7iefp	cmvyzfv1f000rztte8b4vgds3	M26-008	Hery	Ranaivo	2014-08-12 00:00:00	Antananarivo	F	Lot II 17 Antananarivo	+261 34 00 00 07	Parent de Hery	+261 32 11 22 07	\N	2026-10-10 09:00:00	cmvyzfv030005ztteij3n5olv
cmvyzfv1i000szttegzduqxo0	cmvyzfv1j000tztte1mfud795	M26-009	Iony	Rabe	2014-09-13 00:00:00	Antananarivo	M	Lot II 18 Antananarivo	+261 34 00 00 08	Parent de Iony	+261 32 11 22 08	\N	2026-10-11 09:00:00	cmvyzfv030005ztteij3n5olv
cmvyzfv1m000uztteclw6s589	cmvyzfv1m000vztte13n25ixt	M26-010	Jao	Rakotomalala	2014-10-14 00:00:00	Antananarivo	F	Lot II 19 Antananarivo	+261 34 00 00 09	Parent de Jao	+261 32 11 22 09	\N	2026-10-12 09:00:00	cmvyzfv030005ztteij3n5olv
\.


--
-- Data for Name: StudentAttendance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."StudentAttendance" (id, "sessionId", "studentId", status, "minutesLate", note, "markedAt") FROM stdin;
cmvyzfv27001cztteqexwovzo	cmvyzfv1q000xzttej94trxn5	cmvyzfv0g000cztte5m5c431s	LATE	15	\N	2026-11-02 08:13:59.168
cmvyzfv27001dzttec0zjq58o	cmvyzfv1q000xzttej94trxn5	cmvyzfv0n000eztteo67wygej	ABSENT	0	\N	2026-11-02 08:13:59.168
cmvyzfv27001eztte0dkww0f2	cmvyzfv1q000xzttej94trxn5	cmvyzfv0t000gzttek8qsqyjj	PRESENT	0	\N	2026-11-02 08:13:59.168
cmvyzfv27001fztteu2jz6eby	cmvyzfv1q000xzttej94trxn5	cmvyzfv0x000iztteda8zx3n4	PRESENT	0	\N	2026-11-02 08:13:59.168
cmvyzfv27001gztteuv18k24v	cmvyzfv1q000xzttej94trxn5	cmvyzfv12000kztte65rwntv6	PRESENT	0	\N	2026-11-02 08:13:59.168
cmvyzfv27001hzttek1grd4k2	cmvyzfv1q000xzttej94trxn5	cmvyzfv16000mztte09liwvf4	PRESENT	0	\N	2026-11-02 08:13:59.168
cmvyzfv27001izttevzbojhvg	cmvyzfv1q000xzttej94trxn5	cmvyzfv1b000ozttet72vj07i	PRESENT	0	\N	2026-11-02 08:13:59.168
cmvyzfv27001jzttetigls0gw	cmvyzfv1q000xzttej94trxn5	cmvyzfv1f000qzttep2y7iefp	PRESENT	0	\N	2026-11-02 08:13:59.168
cmvyzfv27001kzttec92r1a9u	cmvyzfv1q000xzttej94trxn5	cmvyzfv1i000szttegzduqxo0	PRESENT	0	\N	2026-11-02 08:13:59.168
cmvyzfv27001lztteqwjfv3b1	cmvyzfv1q000xzttej94trxn5	cmvyzfv1m000uztteclw6s589	PRESENT	0	\N	2026-11-02 08:13:59.168
cmvyzfv2t001ozttebrl478ws	cmvyzfv1t000zztte8k4sifq3	cmvyzfv0g000cztte5m5c431s	LATE	15	\N	2026-11-02 08:13:59.189
cmvyzfv2t001pzttet3xzbuty	cmvyzfv1t000zztte8k4sifq3	cmvyzfv0n000eztteo67wygej	ABSENT	0	\N	2026-11-02 08:13:59.189
cmvyzfv2t001qztte97j5v19p	cmvyzfv1t000zztte8k4sifq3	cmvyzfv0t000gzttek8qsqyjj	PRESENT	0	\N	2026-11-02 08:13:59.189
cmvyzfv2t001rztteo6ea2x3j	cmvyzfv1t000zztte8k4sifq3	cmvyzfv0x000iztteda8zx3n4	PRESENT	0	\N	2026-11-02 08:13:59.189
cmvyzfv2t001szttezggc0qaz	cmvyzfv1t000zztte8k4sifq3	cmvyzfv12000kztte65rwntv6	PRESENT	0	\N	2026-11-02 08:13:59.189
cmvyzfv2t001tzttejsmurkui	cmvyzfv1t000zztte8k4sifq3	cmvyzfv16000mztte09liwvf4	PRESENT	0	\N	2026-11-02 08:13:59.189
cmvyzfv2t001uzttegux5f4yw	cmvyzfv1t000zztte8k4sifq3	cmvyzfv1b000ozttet72vj07i	PRESENT	0	\N	2026-11-02 08:13:59.189
cmvyzfv2t001vztte12xcxqwb	cmvyzfv1t000zztte8k4sifq3	cmvyzfv1f000qzttep2y7iefp	PRESENT	0	\N	2026-11-02 08:13:59.189
cmvyzfv2t001wzttezulqupkw	cmvyzfv1t000zztte8k4sifq3	cmvyzfv1i000szttegzduqxo0	PRESENT	0	\N	2026-11-02 08:13:59.189
cmvyzfv2t001xzttenzxbpkxf	cmvyzfv1t000zztte8k4sifq3	cmvyzfv1m000uztteclw6s589	PRESENT	0	\N	2026-11-02 08:13:59.189
cmvyzfv2x0020ztte29mfsf6l	cmvyzfv1w0011zttefr7opj73	cmvyzfv0g000cztte5m5c431s	LATE	15	\N	2026-11-02 08:13:59.193
cmvyzfv2x0021zttewnixqa6a	cmvyzfv1w0011zttefr7opj73	cmvyzfv0n000eztteo67wygej	ABSENT	0	\N	2026-11-02 08:13:59.193
cmvyzfv2x0022ztte8ukhcf8z	cmvyzfv1w0011zttefr7opj73	cmvyzfv0t000gzttek8qsqyjj	PRESENT	0	\N	2026-11-02 08:13:59.193
cmvyzfv2x0023zttey1gbi6g1	cmvyzfv1w0011zttefr7opj73	cmvyzfv0x000iztteda8zx3n4	PRESENT	0	\N	2026-11-02 08:13:59.193
cmvyzfv2x0024zttel6hvtw9w	cmvyzfv1w0011zttefr7opj73	cmvyzfv12000kztte65rwntv6	PRESENT	0	\N	2026-11-02 08:13:59.193
cmvyzfv2x0025zttew9z2teo3	cmvyzfv1w0011zttefr7opj73	cmvyzfv16000mztte09liwvf4	PRESENT	0	\N	2026-11-02 08:13:59.193
cmvyzfv2x0026ztteju1ykhmi	cmvyzfv1w0011zttefr7opj73	cmvyzfv1b000ozttet72vj07i	PRESENT	0	\N	2026-11-02 08:13:59.193
cmvyzfv2x0027ztterjjr5j5y	cmvyzfv1w0011zttefr7opj73	cmvyzfv1f000qzttep2y7iefp	PRESENT	0	\N	2026-11-02 08:13:59.193
cmvyzfv2x0028ztteuk6nyj11	cmvyzfv1w0011zttefr7opj73	cmvyzfv1i000szttegzduqxo0	PRESENT	0	\N	2026-11-02 08:13:59.193
cmvyzfv2x0029zttejej2fdmw	cmvyzfv1w0011zttefr7opj73	cmvyzfv1m000uztteclw6s589	PRESENT	0	\N	2026-11-02 08:13:59.193
cmvyzfv31002cztte9luhsbmt	cmvyzfv1x0013zttewyv9vlmx	cmvyzfv0g000cztte5m5c431s	LATE	15	\N	2026-11-02 08:13:59.197
cmvyzfv31002dzttey31ansre	cmvyzfv1x0013zttewyv9vlmx	cmvyzfv0n000eztteo67wygej	ABSENT	0	\N	2026-11-02 08:13:59.197
cmvyzfv31002eztte60y8ph36	cmvyzfv1x0013zttewyv9vlmx	cmvyzfv0t000gzttek8qsqyjj	PRESENT	0	\N	2026-11-02 08:13:59.197
cmvyzfv31002fzttep75fwmds	cmvyzfv1x0013zttewyv9vlmx	cmvyzfv0x000iztteda8zx3n4	PRESENT	0	\N	2026-11-02 08:13:59.197
cmvyzfv31002gzttebc2sqnpa	cmvyzfv1x0013zttewyv9vlmx	cmvyzfv12000kztte65rwntv6	PRESENT	0	\N	2026-11-02 08:13:59.197
cmvyzfv31002hzttewhcurteo	cmvyzfv1x0013zttewyv9vlmx	cmvyzfv16000mztte09liwvf4	PRESENT	0	\N	2026-11-02 08:13:59.197
cmvyzfv31002izttea0305ssw	cmvyzfv1x0013zttewyv9vlmx	cmvyzfv1b000ozttet72vj07i	PRESENT	0	\N	2026-11-02 08:13:59.197
cmvyzfv31002jztteafpft9tz	cmvyzfv1x0013zttewyv9vlmx	cmvyzfv1f000qzttep2y7iefp	PRESENT	0	\N	2026-11-02 08:13:59.197
cmvyzfv31002kzttes7djna0i	cmvyzfv1x0013zttewyv9vlmx	cmvyzfv1i000szttegzduqxo0	PRESENT	0	\N	2026-11-02 08:13:59.197
cmvyzfv31002lzttesveyqm52	cmvyzfv1x0013zttewyv9vlmx	cmvyzfv1m000uztteclw6s589	PRESENT	0	\N	2026-11-02 08:13:59.197
cmvyzfv35002oztte82u8pj6n	cmvyzfv1z0015ztteq6k5zbg5	cmvyzfv0g000cztte5m5c431s	PRESENT	0	\N	2026-11-02 08:13:59.202
cmvyzfv35002pzttew3ypjvip	cmvyzfv1z0015ztteq6k5zbg5	cmvyzfv0n000eztteo67wygej	ABSENT	0	\N	2026-11-02 08:13:59.202
cmvyzfv35002qzttem56lpd9p	cmvyzfv1z0015ztteq6k5zbg5	cmvyzfv0t000gzttek8qsqyjj	PRESENT	0	\N	2026-11-02 08:13:59.202
cmvyzfv35002rzttesdozowz4	cmvyzfv1z0015ztteq6k5zbg5	cmvyzfv0x000iztteda8zx3n4	PRESENT	0	\N	2026-11-02 08:13:59.202
cmvyzfv35002szttez2mrghb7	cmvyzfv1z0015ztteq6k5zbg5	cmvyzfv12000kztte65rwntv6	PRESENT	0	\N	2026-11-02 08:13:59.202
cmvyzfv35002tztte89str7kb	cmvyzfv1z0015ztteq6k5zbg5	cmvyzfv16000mztte09liwvf4	PRESENT	0	\N	2026-11-02 08:13:59.202
cmvyzfv35002uzttedhxaia2z	cmvyzfv1z0015ztteq6k5zbg5	cmvyzfv1b000ozttet72vj07i	PRESENT	0	\N	2026-11-02 08:13:59.202
cmvyzfv35002vztte3n5dtp8n	cmvyzfv1z0015ztteq6k5zbg5	cmvyzfv1f000qzttep2y7iefp	PRESENT	0	\N	2026-11-02 08:13:59.202
cmvyzfv35002wzttehki9cahv	cmvyzfv1z0015ztteq6k5zbg5	cmvyzfv1i000szttegzduqxo0	PRESENT	0	\N	2026-11-02 08:13:59.202
cmvyzfv36002xztteeeujiws7	cmvyzfv1z0015ztteq6k5zbg5	cmvyzfv1m000uztteclw6s589	PRESENT	0	\N	2026-11-02 08:13:59.202
cmvyzfv3a0030ztteisusrfc6	cmvyzfv210017ztte2p7fhwyb	cmvyzfv0g000cztte5m5c431s	PRESENT	0	\N	2026-11-02 08:13:59.206
cmvyzfv3a0031zttecprfbaza	cmvyzfv210017ztte2p7fhwyb	cmvyzfv0n000eztteo67wygej	ABSENT	0	\N	2026-11-02 08:13:59.206
cmvyzfv3a0032zttek8nm7no8	cmvyzfv210017ztte2p7fhwyb	cmvyzfv0t000gzttek8qsqyjj	PRESENT	0	\N	2026-11-02 08:13:59.206
cmvyzfv3a0033ztte1txbvhmp	cmvyzfv210017ztte2p7fhwyb	cmvyzfv0x000iztteda8zx3n4	PRESENT	0	\N	2026-11-02 08:13:59.206
cmvyzfv3a0034ztteepad1h3l	cmvyzfv210017ztte2p7fhwyb	cmvyzfv12000kztte65rwntv6	PRESENT	0	\N	2026-11-02 08:13:59.206
cmvyzfv3a0035ztte1krmwqcp	cmvyzfv210017ztte2p7fhwyb	cmvyzfv16000mztte09liwvf4	PRESENT	0	\N	2026-11-02 08:13:59.206
cmvyzfv3a0036ztte24ozw2n3	cmvyzfv210017ztte2p7fhwyb	cmvyzfv1b000ozttet72vj07i	PRESENT	0	\N	2026-11-02 08:13:59.206
cmvyzfv3a0037zttetnt1z456	cmvyzfv210017ztte2p7fhwyb	cmvyzfv1f000qzttep2y7iefp	PRESENT	0	\N	2026-11-02 08:13:59.206
cmvyzfv3a0038ztteihov9bhb	cmvyzfv210017ztte2p7fhwyb	cmvyzfv1i000szttegzduqxo0	PRESENT	0	\N	2026-11-02 08:13:59.206
cmvyzfv3a0039ztte2dqxgndw	cmvyzfv210017ztte2p7fhwyb	cmvyzfv1m000uztteclw6s589	PRESENT	0	\N	2026-11-02 08:13:59.206
cmvyzfv3e003cztten6ojmyvl	cmvyzfv230019zttetcz4fifr	cmvyzfv0g000cztte5m5c431s	PRESENT	0	\N	2026-11-02 08:13:59.211
cmvyzfv3e003dzttebq45745a	cmvyzfv230019zttetcz4fifr	cmvyzfv0n000eztteo67wygej	ABSENT	0	\N	2026-11-02 08:13:59.211
cmvyzfv3e003eztteb4tltnka	cmvyzfv230019zttetcz4fifr	cmvyzfv0t000gzttek8qsqyjj	PRESENT	0	\N	2026-11-02 08:13:59.211
cmvyzfv3e003fztte5a6ux0rb	cmvyzfv230019zttetcz4fifr	cmvyzfv0x000iztteda8zx3n4	PRESENT	0	\N	2026-11-02 08:13:59.211
cmvyzfv3e003gztte544n94b9	cmvyzfv230019zttetcz4fifr	cmvyzfv12000kztte65rwntv6	PRESENT	0	\N	2026-11-02 08:13:59.211
cmvyzfv3e003hztteqx04rqgj	cmvyzfv230019zttetcz4fifr	cmvyzfv16000mztte09liwvf4	PRESENT	0	\N	2026-11-02 08:13:59.211
cmvyzfv3e003iztteievil95a	cmvyzfv230019zttetcz4fifr	cmvyzfv1b000ozttet72vj07i	PRESENT	0	\N	2026-11-02 08:13:59.211
cmvyzfv3e003jztteog003r08	cmvyzfv230019zttetcz4fifr	cmvyzfv1f000qzttep2y7iefp	PRESENT	0	\N	2026-11-02 08:13:59.211
cmvyzfv3e003kzttel2igfqn4	cmvyzfv230019zttetcz4fifr	cmvyzfv1i000szttegzduqxo0	PRESENT	0	\N	2026-11-02 08:13:59.211
cmvyzfv3e003lztteg29804fw	cmvyzfv230019zttetcz4fifr	cmvyzfv1m000uztteclw6s589	PRESENT	0	\N	2026-11-02 08:13:59.211
cmvyzfv3i003oztterl629mth	cmvyzfv25001bztteq2jc6y1s	cmvyzfv0g000cztte5m5c431s	PRESENT	0	\N	2026-11-02 08:13:59.215
cmvyzfv3i003pzttelbtf0in0	cmvyzfv25001bztteq2jc6y1s	cmvyzfv0n000eztteo67wygej	ABSENT	0	\N	2026-11-02 08:13:59.215
cmvyzfv3i003qztte128qjt9d	cmvyzfv25001bztteq2jc6y1s	cmvyzfv0t000gzttek8qsqyjj	PRESENT	0	\N	2026-11-02 08:13:59.215
cmvyzfv3i003rztte2lkq8qby	cmvyzfv25001bztteq2jc6y1s	cmvyzfv0x000iztteda8zx3n4	PRESENT	0	\N	2026-11-02 08:13:59.215
cmvyzfv3i003sztte7z1bvsrm	cmvyzfv25001bztteq2jc6y1s	cmvyzfv12000kztte65rwntv6	PRESENT	0	\N	2026-11-02 08:13:59.215
cmvyzfv3i003tztte446uex2v	cmvyzfv25001bztteq2jc6y1s	cmvyzfv16000mztte09liwvf4	PRESENT	0	\N	2026-11-02 08:13:59.215
cmvyzfv3i003uztter1dfcl6h	cmvyzfv25001bztteq2jc6y1s	cmvyzfv1b000ozttet72vj07i	PRESENT	0	\N	2026-11-02 08:13:59.215
cmvyzfv3i003vztteg14dg4ag	cmvyzfv25001bztteq2jc6y1s	cmvyzfv1f000qzttep2y7iefp	PRESENT	0	\N	2026-11-02 08:13:59.215
cmvyzfv3i003wztteph7o3514	cmvyzfv25001bztteq2jc6y1s	cmvyzfv1i000szttegzduqxo0	PRESENT	0	\N	2026-11-02 08:13:59.215
cmvyzfv3i003xztte3ib4z5to	cmvyzfv25001bztteq2jc6y1s	cmvyzfv1m000uztteclw6s589	PRESENT	0	\N	2026-11-02 08:13:59.215
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
cmvyzfv050006ztteqt8m3ash	Mathématiques
cmvyzrabp0000epmi2qmfjx5y	Physique
cmvyzrga60001epmibfir6v6g	Malagasy
cmvyzruvh0002epmimu4d2rsv	English
cmvyzs3920003epmi2avum7c2	Histoire
cmvyzfv070007zttej8sqa7tk	Français
\.


--
-- Data for Name: Teacher; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Teacher" (id, "userId", "hourlyRate") FROM stdin;
cmvyzfuzo0001zttermxozw9e	cmvyzfuzp0002ztte71cn0q0g	8000.00
cmvyzfuzz0003ztte1wyqodzm	cmvyzfuzz0004ztteglqz1pjm	9000.00
cmvzdi9310002yxu9xxy8levw	cmvzc5hcp0006xqbga5lznu76	0.00
cmvzdi9390004yxu9rytwku5t	cmvzc6fnc0007xqbg8c3m5znx	0.00
cmvzeigbe000412gwzst0fxeh	cmvzeigbe000512gw504odth3	0.00
\.


--
-- Data for Name: TeacherAttendance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TeacherAttendance" (id, "sessionId", "teacherId", status, "arrivedAt", "leftAt", note) FROM stdin;
cmvyzfv2q001nztteq19gfb4r	cmvyzfv1q000xzttej94trxn5	cmvyzfuzo0001zttermxozw9e	PRESENT	\N	\N	\N
cmvyzfv2v001zzttex4driosq	cmvyzfv1t000zztte8k4sifq3	cmvyzfuzz0003ztte1wyqodzm	LATE	2026-11-01 08:20:00	\N	\N
cmvyzfv2z002bztteacj6r5gh	cmvyzfv1w0011zttefr7opj73	cmvyzfuzo0001zttermxozw9e	PRESENT	\N	\N	\N
cmvyzfv34002nzttejhlk7waz	cmvyzfv1x0013zttewyv9vlmx	cmvyzfuzz0003ztte1wyqodzm	LATE	2026-10-30 08:20:00	\N	\N
cmvyzfv38002zztteo9386zfr	cmvyzfv1z0015ztteq6k5zbg5	cmvyzfuzo0001zttermxozw9e	ABSENT	\N	\N	\N
cmvyzfv3c003bzttecweug3s7	cmvyzfv210017ztte2p7fhwyb	cmvyzfuzz0003ztte1wyqodzm	LATE	2026-10-28 08:20:00	\N	\N
cmvyzfv3h003nztte0wdiizt7	cmvyzfv230019zttetcz4fifr	cmvyzfuzo0001zttermxozw9e	ABSENT	\N	\N	\N
cmvyzfv3q003zztteqte190tn	cmvyzfv25001bztteq2jc6y1s	cmvyzfuzz0003ztte1wyqodzm	LATE	2026-10-26 08:20:00	\N	\N
\.


--
-- Data for Name: Term; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Term" (id, name, "startDate", "endDate") FROM stdin;
cmvyzfv3r0040zttewjnktxlm	Trimestre 1	2026-09-03 12:00:00	2027-01-01 12:00:00
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, email, "passwordHash", name, role, active, "createdAt") FROM stdin;
cmvyzfuza0000zttel91xnrrd	admin@ecole.mg	$2a$10$kReULK6yOgZDjqNeXvWEFuADF4c0qTVjfLjBk5ZSae5jZ79AhdHHS	Administrateur	ADMIN	t	2026-11-02 08:13:59.061
cmvyzfuzp0002ztte71cn0q0g	rakoto@ecole.mg	$2a$10$kReULK6yOgZDjqNeXvWEFuADF4c0qTVjfLjBk5ZSae5jZ79AhdHHS	Rakoto Jean	TEACHER	t	2026-11-02 08:13:59.077
cmvyzfuzz0004ztteglqz1pjm	rasoa@ecole.mg	$2a$10$kReULK6yOgZDjqNeXvWEFuADF4c0qTVjfLjBk5ZSae5jZ79AhdHHS	Rasoa Marie	TEACHER	t	2026-11-02 08:13:59.088
cmvyzfv0g000dztten6ece593	andry@ecole.mg	$2a$10$kReULK6yOgZDjqNeXvWEFuADF4c0qTVjfLjBk5ZSae5jZ79AhdHHS	Andry Randria	STUDENT	t	2026-11-02 08:13:59.104
cmvyzfv0n000fztteli5b294i	bodo@ecole.mg	$2a$10$kReULK6yOgZDjqNeXvWEFuADF4c0qTVjfLjBk5ZSae5jZ79AhdHHS	Bodo Ravelo	STUDENT	t	2026-11-02 08:13:59.111
cmvyzfv0t000hzttegcyxiq9r	chloe@ecole.mg	$2a$10$kReULK6yOgZDjqNeXvWEFuADF4c0qTVjfLjBk5ZSae5jZ79AhdHHS	Chloé Rakoto	STUDENT	t	2026-11-02 08:13:59.117
cmvyzfv0x000jzttey3gbdhvb	dina@ecole.mg	$2a$10$kReULK6yOgZDjqNeXvWEFuADF4c0qTVjfLjBk5ZSae5jZ79AhdHHS	Dina Rasoa	STUDENT	t	2026-11-02 08:13:59.122
cmvyzfv12000lzttevlwrbkwp	eric@ecole.mg	$2a$10$kReULK6yOgZDjqNeXvWEFuADF4c0qTVjfLjBk5ZSae5jZ79AhdHHS	Eric Andrianina	STUDENT	t	2026-11-02 08:13:59.127
cmvyzfv17000nzttea45nasii	faly@ecole.mg	$2a$10$kReULK6yOgZDjqNeXvWEFuADF4c0qTVjfLjBk5ZSae5jZ79AhdHHS	Faly Hery	STUDENT	t	2026-11-02 08:13:59.131
cmvyzfv1b000pztte5uwl381c	gaby@ecole.mg	$2a$10$kReULK6yOgZDjqNeXvWEFuADF4c0qTVjfLjBk5ZSae5jZ79AhdHHS	Gaby Razafy	STUDENT	t	2026-11-02 08:13:59.135
cmvyzfv1f000rztte8b4vgds3	hery@ecole.mg	$2a$10$kReULK6yOgZDjqNeXvWEFuADF4c0qTVjfLjBk5ZSae5jZ79AhdHHS	Hery Ranaivo	STUDENT	t	2026-11-02 08:13:59.139
cmvyzfv1j000tztte1mfud795	iony@ecole.mg	$2a$10$kReULK6yOgZDjqNeXvWEFuADF4c0qTVjfLjBk5ZSae5jZ79AhdHHS	Iony Rabe	STUDENT	t	2026-11-02 08:13:59.143
cmvzc5hcp0006xqbga5lznu76	rakotobe@gmail.com	$2a$10$pAR5VoQ2s7KjuFjWXgSmS.kMaK7oi3bVWZmYrlHMy5hooTp2agoei	Rakotobe	TEACHER	t	2026-11-02 14:09:49.849
cmvzc6fnc0007xqbg8c3m5znx	ramaria@gmail.com	$2a$10$p9U.QRawwkwYNPZxhRma4uiuMjdckfcb1Vv1gzacDPGM672X8nf/S	Ramaria	TEACHER	t	2026-11-02 14:10:34.296
cmvyzfv1m000vztte13n25ixt	jao@ecole.mg	$2a$10$kReULK6yOgZDjqNeXvWEFuADF4c0qTVjfLjBk5ZSae5jZ79AhdHHS	Jao Rakotomalala	STUDENT	t	2026-11-02 08:13:59.147
cmvzdf9tc0000yxu9sbc5ahwf	joseph@gmail.com	$2a$10$xA/mPOP/u5NOX9fPxREJ8.biY6bXi7c6yTOAdV39YFB2/d0xcHCuG	Joseph	MANAGER	t	2026-11-02 14:45:26.255
cmvzeigbe000512gw504odth3	joseph6@gmail.com	$2a$10$IfK2YFhnb20zivnUafI7tO1HP0UMfB71nUgjy5aKAIM8AE.PE3Wyi	ruryiuryuie	TEACHER	t	2026-11-02 15:15:54.266
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
ff2a6cdd-452a-484a-ab41-ef156b7bf5e5	cd85756a56117a2742f6f92435222cb08b43c16a8ce9c3db60c6a0570ac7db55	2026-11-02 09:06:09.384928+03	20261102060609_init_fr	\N	\N	2026-11-02 09:06:09.146429+03	1
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
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


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
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict 4aOQo4iKhb14GiNxN4gQyoqp64ZXkfFuEtum9iJaB1INd3xVTvFAh1orBf5xjcS

