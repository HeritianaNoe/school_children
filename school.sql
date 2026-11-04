--
-- PostgreSQL database dump
--

\restrict GFek27ZBb21idgYXI6ZzsKgNoaI09381EchwYaDPUQPbLUeVUQsaE3JrJP4P54s

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
    'TEACHER',
    'STUDENT',
    'MANAGER'
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
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    phone text,
    "photoUrl" text
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
\.


--
-- Data for Name: Assessment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Assessment" (id, "courseId", "termId", title, type, "maxScore", coefficient, date) FROM stdin;
cmw0jnuuc004210tzdm5a4rwk	cmw0jnujt000910tzxjp3of18	cmw0jnuua004010tz96c12b3z	Interro 1	TEST	20	1	2026-10-31 00:00:00
cmw0jnuuj004e10tzb91pw64x	cmw0jnujw000b10tzve09c1p9	cmw0jnuua004010tz96c12b3z	Dictée 1	TEST	20	1	2026-10-31 00:00:00
\.


--
-- Data for Name: Classe; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Classe" (id, name, year) FROM stdin;
cmw0jnujm000510tz3cpm0wq4	6ème A	2026-2027
cmw0jygx1000010eyzupjc7sd	5ème A	2026-2027
cmw0jzmng000510eyysjgiz1o	4ème A	2026-2027
cmw0k04gy000a10eyrfr6l201	3ème A	2026-2027
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
cmw0jnujt000910tzxjp3of18	cmw0jnujm000510tz3cpm0wq4	cmw0jnujp000610tzjjppc0b0	cmw0jnujd000110tz96pjeedm	3
cmw0jnujw000b10tzve09c1p9	cmw0jnujm000510tz3cpm0wq4	cmw0jnujr000710tz8rm72bb4	cmw0jnujj000310tzjg6yepxc	2
cmw0jyrft000210ey0qpualty	cmw0jygx1000010eyzupjc7sd	cmw0jnujp000610tzjjppc0b0	cmw0jnujd000110tz96pjeedm	1
cmw0jywr9000410eyakcoqd2h	cmw0jygx1000010eyzupjc7sd	cmw0jnujr000710tz8rm72bb4	cmw0jnujd000110tz96pjeedm	1
cmw0jzr69000710eyihx1t1er	cmw0jzmng000510eyysjgiz1o	cmw0jnujp000610tzjjppc0b0	cmw0jnujj000310tzjg6yepxc	1
cmw0jzu5s000910ey9arum1f6	cmw0jzmng000510eyysjgiz1o	cmw0jnujr000710tz8rm72bb4	cmw0jnujj000310tzjg6yepxc	1
cmw0k0air000c10eynjwvmat9	cmw0k04gy000a10eyrfr6l201	cmw0jnujr000710tz8rm72bb4	cmw0jnujd000110tz96pjeedm	1
cmw0k0die000e10eygljpykd7	cmw0k04gy000a10eyrfr6l201	cmw0jnujp000610tzjjppc0b0	cmw0jnujd000110tz96pjeedm	1
\.


--
-- Data for Name: Grade; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Grade" (id, "assessmentId", "studentId", score, "updatedAt") FROM stdin;
cmw0jnuuf004310tz7ib35jpb	cmw0jnuuc004210tzdm5a4rwk	cmw0jnujy000c10tzqc79ta65	8	2026-11-03 10:27:50.631
cmw0jnuuf004410tzf3g7wyei	cmw0jnuuc004210tzdm5a4rwk	cmw0jnuk5000e10tzk0a9wod2	15	2026-11-03 10:27:50.631
cmw0jnuuf004510tz37gtcnpo	cmw0jnuuc004210tzdm5a4rwk	cmw0jnuk9000g10tz0fnx9k71	10	2026-11-03 10:27:50.631
cmw0jnuuf004610tz69fpqain	cmw0jnuuc004210tzdm5a4rwk	cmw0jnukd000i10tzi3ynhv8y	17	2026-11-03 10:27:50.631
cmw0jnuuf004710tzd7g42sed	cmw0jnuuc004210tzdm5a4rwk	cmw0jnukh000k10tzii2sbdnk	12	2026-11-03 10:27:50.631
cmw0jnuuf004810tzvotmcpe3	cmw0jnuuc004210tzdm5a4rwk	cmw0jnukl000m10tzqnu2x568	19	2026-11-03 10:27:50.631
cmw0jnuuf004910tz5bxqep5m	cmw0jnuuc004210tzdm5a4rwk	cmw0jnuoj000o10tz4g0w14e9	14	2026-11-03 10:27:50.631
cmw0jnuuf004a10tzn1447xhn	cmw0jnuuc004210tzdm5a4rwk	cmw0jnuos000q10tzd6lhf3kv	9	2026-11-03 10:27:50.631
cmw0jnuuf004b10tzv7761fe7	cmw0jnuuc004210tzdm5a4rwk	cmw0jnup0000s10tzzyu2f7pe	16	2026-11-03 10:27:50.631
cmw0jnuuf004c10tzgihlkt54	cmw0jnuuc004210tzdm5a4rwk	cmw0jnup5000u10tz8uwx7vhk	\N	2026-11-03 10:27:50.631
cmw0jnuxh004f10tzt71yq7xa	cmw0jnuuj004e10tzb91pw64x	cmw0jnujy000c10tzqc79ta65	8	2026-11-03 10:27:50.741
cmw0jnuxh004g10tzwi2xr7cl	cmw0jnuuj004e10tzb91pw64x	cmw0jnuk5000e10tzk0a9wod2	15	2026-11-03 10:27:50.741
cmw0jnuxh004h10tzmhuh02e2	cmw0jnuuj004e10tzb91pw64x	cmw0jnuk9000g10tz0fnx9k71	10	2026-11-03 10:27:50.741
cmw0jnuxh004i10tzehsq97za	cmw0jnuuj004e10tzb91pw64x	cmw0jnukd000i10tzi3ynhv8y	17	2026-11-03 10:27:50.741
cmw0jnuxh004j10tz1ga5c3yj	cmw0jnuuj004e10tzb91pw64x	cmw0jnukh000k10tzii2sbdnk	12	2026-11-03 10:27:50.741
cmw0jnuxh004k10tzly7i3r19	cmw0jnuuj004e10tzb91pw64x	cmw0jnukl000m10tzqnu2x568	19	2026-11-03 10:27:50.741
cmw0jnuxh004l10tzj4edqb4v	cmw0jnuuj004e10tzb91pw64x	cmw0jnuoj000o10tz4g0w14e9	14	2026-11-03 10:27:50.741
cmw0jnuxh004m10tzworxz7cd	cmw0jnuuj004e10tzb91pw64x	cmw0jnuos000q10tzd6lhf3kv	9	2026-11-03 10:27:50.741
cmw0jnuxh004n10tz2hxqfmo7	cmw0jnuuj004e10tzb91pw64x	cmw0jnup0000s10tzzyu2f7pe	16	2026-11-03 10:27:50.741
cmw0jnuxh004o10tzh7oenzh5	cmw0jnuuj004e10tzb91pw64x	cmw0jnup5000u10tz8uwx7vhk	\N	2026-11-03 10:27:50.741
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
cmw0jnupa000x10tzqoa6m66t	cmw0jnujt000910tzxjp3of18	cmw0jnujd000110tz96pjeedm	2026-11-03 08:00:00	2026-11-03 10:00:00	DONE
cmw0jnupe000z10tz5auynnpq	cmw0jnujw000b10tzve09c1p9	cmw0jnujj000310tzjg6yepxc	2026-11-02 08:00:00	2026-11-02 10:00:00	DONE
cmw0jnupg001110tzy9fa2d6y	cmw0jnujt000910tzxjp3of18	cmw0jnujd000110tz96pjeedm	2026-11-01 08:00:00	2026-11-01 10:00:00	DONE
cmw0jnupi001310tzb6lmepzs	cmw0jnujw000b10tzve09c1p9	cmw0jnujj000310tzjg6yepxc	2026-10-31 08:00:00	2026-10-31 10:00:00	DONE
cmw0jnupk001510tz6gi3wku3	cmw0jnujt000910tzxjp3of18	cmw0jnujd000110tz96pjeedm	2026-10-30 08:00:00	2026-10-30 10:00:00	DONE
cmw0jnupm001710tztttbpn1x	cmw0jnujw000b10tzve09c1p9	cmw0jnujj000310tzjg6yepxc	2026-10-29 08:00:00	2026-10-29 10:00:00	DONE
cmw0jnupp001910tzs75ps3s9	cmw0jnujt000910tzxjp3of18	cmw0jnujd000110tz96pjeedm	2026-10-28 08:00:00	2026-10-28 10:00:00	DONE
cmw0jnupr001b10tzdah6tme9	cmw0jnujw000b10tzve09c1p9	cmw0jnujj000310tzjg6yepxc	2026-10-27 08:00:00	2026-10-27 10:00:00	DONE
\.


--
-- Data for Name: Student; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Student" (id, "userId", matricule, "firstName", "lastName", "birthDate", "birthPlace", sex, address, phone, "parentName", "parentPhone", "photoUrl", "registeredAt", "classeId") FROM stdin;
cmw0jnujy000c10tzqc79ta65	cmw0jnujz000d10tzmcc1lz01	M26-001	Andry	Randria	2014-01-05 00:00:00	Antananarivo	M	Lot II 10 Antananarivo	+261 34 00 00 00	Parent de Andry	+261 32 11 22 00	\N	2026-10-04 09:00:00	cmw0jnujm000510tz3cpm0wq4
cmw0jnuk5000e10tzk0a9wod2	cmw0jnuk5000f10tzy2k1w2bm	M26-002	Bodo	Ravelo	2014-02-06 00:00:00	Antananarivo	F	Lot II 11 Antananarivo	+261 34 00 00 01	Parent de Bodo	+261 32 11 22 01	\N	2026-10-05 09:00:00	cmw0jnujm000510tz3cpm0wq4
cmw0jnuk9000g10tz0fnx9k71	cmw0jnuk9000h10tzx2l9rrjp	M26-003	Chloé	Rakoto	2014-03-07 00:00:00	Antananarivo	M	Lot II 12 Antananarivo	+261 34 00 00 02	Parent de Chloé	+261 32 11 22 02	\N	2026-10-06 09:00:00	cmw0jnujm000510tz3cpm0wq4
cmw0jnukd000i10tzi3ynhv8y	cmw0jnukd000j10tzxwm6sqmw	M26-004	Dina	Rasoa	2014-04-08 00:00:00	Antananarivo	F	Lot II 13 Antananarivo	+261 34 00 00 03	Parent de Dina	+261 32 11 22 03	\N	2026-10-07 09:00:00	cmw0jnujm000510tz3cpm0wq4
cmw0jnukh000k10tzii2sbdnk	cmw0jnukh000l10tzwzhf67rc	M26-005	Eric	Andrianina	2014-05-09 00:00:00	Antananarivo	M	Lot II 14 Antananarivo	+261 34 00 00 04	Parent de Eric	+261 32 11 22 04	\N	2026-10-08 09:00:00	cmw0jnujm000510tz3cpm0wq4
cmw0jnukl000m10tzqnu2x568	cmw0jnukl000n10tz4wumubxn	M26-006	Faly	Hery	2014-06-10 00:00:00	Antananarivo	F	Lot II 15 Antananarivo	+261 34 00 00 05	Parent de Faly	+261 32 11 22 05	\N	2026-10-09 09:00:00	cmw0jnujm000510tz3cpm0wq4
cmw0jnuoj000o10tz4g0w14e9	cmw0jnuoj000p10tzcor84fr5	M26-007	Gaby	Razafy	2014-07-11 00:00:00	Antananarivo	M	Lot II 16 Antananarivo	+261 34 00 00 06	Parent de Gaby	+261 32 11 22 06	\N	2026-10-10 09:00:00	cmw0jnujm000510tz3cpm0wq4
cmw0jnuos000q10tzd6lhf3kv	cmw0jnuos000r10tz9rxljabc	M26-008	Hery	Ranaivo	2014-08-12 00:00:00	Antananarivo	F	Lot II 17 Antananarivo	+261 34 00 00 07	Parent de Hery	+261 32 11 22 07	\N	2026-10-11 09:00:00	cmw0jnujm000510tz3cpm0wq4
cmw0jnup0000s10tzzyu2f7pe	cmw0jnup1000t10tzmhm323px	M26-009	Iony	Rabe	2014-09-13 00:00:00	Antananarivo	M	Lot II 18 Antananarivo	+261 34 00 00 08	Parent de Iony	+261 32 11 22 08	\N	2026-10-12 09:00:00	cmw0jnujm000510tz3cpm0wq4
cmw0jnup5000u10tz8uwx7vhk	cmw0jnup6000v10tzazwiv3la	M26-010	Jao	Rakotomalala	2014-10-14 00:00:00	Antananarivo	F	Lot II 19 Antananarivo	+261 34 00 00 09	Parent de Jao	+261 32 11 22 09	\N	2026-10-13 09:00:00	cmw0jnujm000510tz3cpm0wq4
\.


--
-- Data for Name: StudentAttendance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."StudentAttendance" (id, "sessionId", "studentId", status, "minutesLate", note, "markedAt") FROM stdin;
cmw0jnupt001c10tznwmu2dxq	cmw0jnupa000x10tzqoa6m66t	cmw0jnujy000c10tzqc79ta65	LATE	15	\N	2026-11-03 10:27:50.465
cmw0jnupt001d10tzot60ck1l	cmw0jnupa000x10tzqoa6m66t	cmw0jnuk5000e10tzk0a9wod2	ABSENT	0	\N	2026-11-03 10:27:50.465
cmw0jnupt001e10tzeqvvt9gj	cmw0jnupa000x10tzqoa6m66t	cmw0jnuk9000g10tz0fnx9k71	PRESENT	0	\N	2026-11-03 10:27:50.465
cmw0jnupt001f10tze836d3o5	cmw0jnupa000x10tzqoa6m66t	cmw0jnukd000i10tzi3ynhv8y	PRESENT	0	\N	2026-11-03 10:27:50.465
cmw0jnupt001g10tz28jrrihr	cmw0jnupa000x10tzqoa6m66t	cmw0jnukh000k10tzii2sbdnk	PRESENT	0	\N	2026-11-03 10:27:50.465
cmw0jnupt001h10tz6zsczssa	cmw0jnupa000x10tzqoa6m66t	cmw0jnukl000m10tzqnu2x568	PRESENT	0	\N	2026-11-03 10:27:50.465
cmw0jnupt001i10tzx64jntgk	cmw0jnupa000x10tzqoa6m66t	cmw0jnuoj000o10tz4g0w14e9	PRESENT	0	\N	2026-11-03 10:27:50.465
cmw0jnupt001j10tzgtay4ecw	cmw0jnupa000x10tzqoa6m66t	cmw0jnuos000q10tzd6lhf3kv	PRESENT	0	\N	2026-11-03 10:27:50.465
cmw0jnupt001k10tzaqxwzse6	cmw0jnupa000x10tzqoa6m66t	cmw0jnup0000s10tzzyu2f7pe	PRESENT	0	\N	2026-11-03 10:27:50.465
cmw0jnupt001l10tzetgqu5rk	cmw0jnupa000x10tzqoa6m66t	cmw0jnup5000u10tz8uwx7vhk	PRESENT	0	\N	2026-11-03 10:27:50.465
cmw0jnuq2001o10tzhsi8840k	cmw0jnupe000z10tz5auynnpq	cmw0jnujy000c10tzqc79ta65	LATE	15	\N	2026-11-03 10:27:50.474
cmw0jnuq2001p10tz7xbkmpfh	cmw0jnupe000z10tz5auynnpq	cmw0jnuk5000e10tzk0a9wod2	ABSENT	0	\N	2026-11-03 10:27:50.474
cmw0jnuq2001q10tzgq63hk3z	cmw0jnupe000z10tz5auynnpq	cmw0jnuk9000g10tz0fnx9k71	PRESENT	0	\N	2026-11-03 10:27:50.474
cmw0jnuq2001r10tzzgofmeog	cmw0jnupe000z10tz5auynnpq	cmw0jnukd000i10tzi3ynhv8y	PRESENT	0	\N	2026-11-03 10:27:50.474
cmw0jnuq2001s10tzvfp25wq3	cmw0jnupe000z10tz5auynnpq	cmw0jnukh000k10tzii2sbdnk	PRESENT	0	\N	2026-11-03 10:27:50.474
cmw0jnuq2001t10tz7vg79zno	cmw0jnupe000z10tz5auynnpq	cmw0jnukl000m10tzqnu2x568	PRESENT	0	\N	2026-11-03 10:27:50.474
cmw0jnuq2001u10tzuk7ksn08	cmw0jnupe000z10tz5auynnpq	cmw0jnuoj000o10tz4g0w14e9	PRESENT	0	\N	2026-11-03 10:27:50.474
cmw0jnuq2001v10tzdf6poxo2	cmw0jnupe000z10tz5auynnpq	cmw0jnuos000q10tzd6lhf3kv	PRESENT	0	\N	2026-11-03 10:27:50.474
cmw0jnuq2001w10tzsuauygld	cmw0jnupe000z10tz5auynnpq	cmw0jnup0000s10tzzyu2f7pe	PRESENT	0	\N	2026-11-03 10:27:50.474
cmw0jnuq2001x10tz78j36ahi	cmw0jnupe000z10tz5auynnpq	cmw0jnup5000u10tz8uwx7vhk	PRESENT	0	\N	2026-11-03 10:27:50.474
cmw0jnusw002010tzzlfkb133	cmw0jnupg001110tzy9fa2d6y	cmw0jnujy000c10tzqc79ta65	LATE	15	\N	2026-11-03 10:27:50.576
cmw0jnusw002110tzig9yxwai	cmw0jnupg001110tzy9fa2d6y	cmw0jnuk5000e10tzk0a9wod2	ABSENT	0	\N	2026-11-03 10:27:50.576
cmw0jnusw002210tzojatos7t	cmw0jnupg001110tzy9fa2d6y	cmw0jnuk9000g10tz0fnx9k71	PRESENT	0	\N	2026-11-03 10:27:50.576
cmw0jnusw002310tz0wa526r6	cmw0jnupg001110tzy9fa2d6y	cmw0jnukd000i10tzi3ynhv8y	PRESENT	0	\N	2026-11-03 10:27:50.576
cmw0jnusw002410tzyw5oxqgf	cmw0jnupg001110tzy9fa2d6y	cmw0jnukh000k10tzii2sbdnk	PRESENT	0	\N	2026-11-03 10:27:50.576
cmw0jnusw002510tzsuli6jf9	cmw0jnupg001110tzy9fa2d6y	cmw0jnukl000m10tzqnu2x568	PRESENT	0	\N	2026-11-03 10:27:50.576
cmw0jnusw002610tzv7dojw5i	cmw0jnupg001110tzy9fa2d6y	cmw0jnuoj000o10tz4g0w14e9	PRESENT	0	\N	2026-11-03 10:27:50.576
cmw0jnusw002710tzftjhl14y	cmw0jnupg001110tzy9fa2d6y	cmw0jnuos000q10tzd6lhf3kv	PRESENT	0	\N	2026-11-03 10:27:50.576
cmw0jnusw002810tz5m9n86nw	cmw0jnupg001110tzy9fa2d6y	cmw0jnup0000s10tzzyu2f7pe	PRESENT	0	\N	2026-11-03 10:27:50.576
cmw0jnusw002910tzl1hn9bu9	cmw0jnupg001110tzy9fa2d6y	cmw0jnup5000u10tz8uwx7vhk	PRESENT	0	\N	2026-11-03 10:27:50.576
cmw0jnut6002c10tz9lw54xkg	cmw0jnupi001310tzb6lmepzs	cmw0jnujy000c10tzqc79ta65	LATE	15	\N	2026-11-03 10:27:50.587
cmw0jnut7002d10tzu01gfnuw	cmw0jnupi001310tzb6lmepzs	cmw0jnuk5000e10tzk0a9wod2	ABSENT	0	\N	2026-11-03 10:27:50.587
cmw0jnut7002e10tztm38ucpz	cmw0jnupi001310tzb6lmepzs	cmw0jnuk9000g10tz0fnx9k71	PRESENT	0	\N	2026-11-03 10:27:50.587
cmw0jnut7002f10tz0eznk2de	cmw0jnupi001310tzb6lmepzs	cmw0jnukd000i10tzi3ynhv8y	PRESENT	0	\N	2026-11-03 10:27:50.587
cmw0jnut7002g10tzh8ty9c3z	cmw0jnupi001310tzb6lmepzs	cmw0jnukh000k10tzii2sbdnk	PRESENT	0	\N	2026-11-03 10:27:50.587
cmw0jnut7002h10tzav3v68j6	cmw0jnupi001310tzb6lmepzs	cmw0jnukl000m10tzqnu2x568	PRESENT	0	\N	2026-11-03 10:27:50.587
cmw0jnut7002i10tzlvx2gczv	cmw0jnupi001310tzb6lmepzs	cmw0jnuoj000o10tz4g0w14e9	PRESENT	0	\N	2026-11-03 10:27:50.587
cmw0jnut7002j10tzkzx0d85q	cmw0jnupi001310tzb6lmepzs	cmw0jnuos000q10tzd6lhf3kv	PRESENT	0	\N	2026-11-03 10:27:50.587
cmw0jnut7002k10tzhe5nvpqq	cmw0jnupi001310tzb6lmepzs	cmw0jnup0000s10tzzyu2f7pe	PRESENT	0	\N	2026-11-03 10:27:50.587
cmw0jnut7002l10tz4dqe0orp	cmw0jnupi001310tzb6lmepzs	cmw0jnup5000u10tz8uwx7vhk	PRESENT	0	\N	2026-11-03 10:27:50.587
cmw0jnutg002o10tznlhqn713	cmw0jnupk001510tz6gi3wku3	cmw0jnujy000c10tzqc79ta65	PRESENT	0	\N	2026-11-03 10:27:50.597
cmw0jnutg002p10tzwz8x6cie	cmw0jnupk001510tz6gi3wku3	cmw0jnuk5000e10tzk0a9wod2	ABSENT	0	\N	2026-11-03 10:27:50.597
cmw0jnutg002q10tzh6rcqoo0	cmw0jnupk001510tz6gi3wku3	cmw0jnuk9000g10tz0fnx9k71	PRESENT	0	\N	2026-11-03 10:27:50.597
cmw0jnutg002r10tzqxz9ccnt	cmw0jnupk001510tz6gi3wku3	cmw0jnukd000i10tzi3ynhv8y	PRESENT	0	\N	2026-11-03 10:27:50.597
cmw0jnutg002s10tz4p7igrb3	cmw0jnupk001510tz6gi3wku3	cmw0jnukh000k10tzii2sbdnk	PRESENT	0	\N	2026-11-03 10:27:50.597
cmw0jnutg002t10tz1u9uciwa	cmw0jnupk001510tz6gi3wku3	cmw0jnukl000m10tzqnu2x568	PRESENT	0	\N	2026-11-03 10:27:50.597
cmw0jnutg002u10tz9op90eo6	cmw0jnupk001510tz6gi3wku3	cmw0jnuoj000o10tz4g0w14e9	PRESENT	0	\N	2026-11-03 10:27:50.597
cmw0jnutg002v10tz5ipjppx8	cmw0jnupk001510tz6gi3wku3	cmw0jnuos000q10tzd6lhf3kv	PRESENT	0	\N	2026-11-03 10:27:50.597
cmw0jnutg002w10tzqlsur4qu	cmw0jnupk001510tz6gi3wku3	cmw0jnup0000s10tzzyu2f7pe	PRESENT	0	\N	2026-11-03 10:27:50.597
cmw0jnutg002x10tzkmjbedj1	cmw0jnupk001510tz6gi3wku3	cmw0jnup5000u10tz8uwx7vhk	PRESENT	0	\N	2026-11-03 10:27:50.597
cmw0jnutn003010tzt0x5ghfp	cmw0jnupm001710tztttbpn1x	cmw0jnujy000c10tzqc79ta65	PRESENT	0	\N	2026-11-03 10:27:50.604
cmw0jnuto003110tz71nhyc7i	cmw0jnupm001710tztttbpn1x	cmw0jnuk5000e10tzk0a9wod2	ABSENT	0	\N	2026-11-03 10:27:50.604
cmw0jnuto003210tzbqovbz34	cmw0jnupm001710tztttbpn1x	cmw0jnuk9000g10tz0fnx9k71	PRESENT	0	\N	2026-11-03 10:27:50.604
cmw0jnuto003310tzn0xbkgz3	cmw0jnupm001710tztttbpn1x	cmw0jnukd000i10tzi3ynhv8y	PRESENT	0	\N	2026-11-03 10:27:50.604
cmw0jnuto003410tz3kv3n0ot	cmw0jnupm001710tztttbpn1x	cmw0jnukh000k10tzii2sbdnk	PRESENT	0	\N	2026-11-03 10:27:50.604
cmw0jnuto003510tzsgacjme6	cmw0jnupm001710tztttbpn1x	cmw0jnukl000m10tzqnu2x568	PRESENT	0	\N	2026-11-03 10:27:50.604
cmw0jnuto003610tzakjehe6y	cmw0jnupm001710tztttbpn1x	cmw0jnuoj000o10tz4g0w14e9	PRESENT	0	\N	2026-11-03 10:27:50.604
cmw0jnuto003710tz7fj69zlv	cmw0jnupm001710tztttbpn1x	cmw0jnuos000q10tzd6lhf3kv	PRESENT	0	\N	2026-11-03 10:27:50.604
cmw0jnuto003810tzmulgbw80	cmw0jnupm001710tztttbpn1x	cmw0jnup0000s10tzzyu2f7pe	PRESENT	0	\N	2026-11-03 10:27:50.604
cmw0jnuto003910tzqwf67c12	cmw0jnupm001710tztttbpn1x	cmw0jnup5000u10tz8uwx7vhk	PRESENT	0	\N	2026-11-03 10:27:50.604
cmw0jnutv003c10tzv2rc016w	cmw0jnupp001910tzs75ps3s9	cmw0jnujy000c10tzqc79ta65	PRESENT	0	\N	2026-11-03 10:27:50.611
cmw0jnutv003d10tz7e207cqb	cmw0jnupp001910tzs75ps3s9	cmw0jnuk5000e10tzk0a9wod2	ABSENT	0	\N	2026-11-03 10:27:50.611
cmw0jnutv003e10tz8jpij5oo	cmw0jnupp001910tzs75ps3s9	cmw0jnuk9000g10tz0fnx9k71	PRESENT	0	\N	2026-11-03 10:27:50.611
cmw0jnutv003f10tz5uzyf7xy	cmw0jnupp001910tzs75ps3s9	cmw0jnukd000i10tzi3ynhv8y	PRESENT	0	\N	2026-11-03 10:27:50.611
cmw0jnutv003g10tz8hdqq1by	cmw0jnupp001910tzs75ps3s9	cmw0jnukh000k10tzii2sbdnk	PRESENT	0	\N	2026-11-03 10:27:50.611
cmw0jnutv003h10tzk9ann7qb	cmw0jnupp001910tzs75ps3s9	cmw0jnukl000m10tzqnu2x568	PRESENT	0	\N	2026-11-03 10:27:50.611
cmw0jnutv003i10tzca2bscec	cmw0jnupp001910tzs75ps3s9	cmw0jnuoj000o10tz4g0w14e9	PRESENT	0	\N	2026-11-03 10:27:50.611
cmw0jnutv003j10tz2cqbt53j	cmw0jnupp001910tzs75ps3s9	cmw0jnuos000q10tzd6lhf3kv	PRESENT	0	\N	2026-11-03 10:27:50.611
cmw0jnutv003k10tz9p4p9yza	cmw0jnupp001910tzs75ps3s9	cmw0jnup0000s10tzzyu2f7pe	PRESENT	0	\N	2026-11-03 10:27:50.611
cmw0jnutv003l10tzka7bq6xu	cmw0jnupp001910tzs75ps3s9	cmw0jnup5000u10tz8uwx7vhk	PRESENT	0	\N	2026-11-03 10:27:50.611
cmw0jnuu3003o10tzf84uy0je	cmw0jnupr001b10tzdah6tme9	cmw0jnujy000c10tzqc79ta65	PRESENT	0	\N	2026-11-03 10:27:50.62
cmw0jnuu3003p10tzxo1er03f	cmw0jnupr001b10tzdah6tme9	cmw0jnuk5000e10tzk0a9wod2	ABSENT	0	\N	2026-11-03 10:27:50.62
cmw0jnuu3003q10tzqyc2eorn	cmw0jnupr001b10tzdah6tme9	cmw0jnuk9000g10tz0fnx9k71	PRESENT	0	\N	2026-11-03 10:27:50.62
cmw0jnuu3003r10tznyjsmw8e	cmw0jnupr001b10tzdah6tme9	cmw0jnukd000i10tzi3ynhv8y	PRESENT	0	\N	2026-11-03 10:27:50.62
cmw0jnuu4003s10tz4ee5r2s6	cmw0jnupr001b10tzdah6tme9	cmw0jnukh000k10tzii2sbdnk	PRESENT	0	\N	2026-11-03 10:27:50.62
cmw0jnuu4003t10tzsak95k3h	cmw0jnupr001b10tzdah6tme9	cmw0jnukl000m10tzqnu2x568	PRESENT	0	\N	2026-11-03 10:27:50.62
cmw0jnuu4003u10tzn6bgsrxq	cmw0jnupr001b10tzdah6tme9	cmw0jnuoj000o10tz4g0w14e9	PRESENT	0	\N	2026-11-03 10:27:50.62
cmw0jnuu4003v10tz0spd05kt	cmw0jnupr001b10tzdah6tme9	cmw0jnuos000q10tzd6lhf3kv	PRESENT	0	\N	2026-11-03 10:27:50.62
cmw0jnuu4003w10tz4yd82c4j	cmw0jnupr001b10tzdah6tme9	cmw0jnup0000s10tzzyu2f7pe	PRESENT	0	\N	2026-11-03 10:27:50.62
cmw0jnuu4003x10tz484t1i9f	cmw0jnupr001b10tzdah6tme9	cmw0jnup5000u10tz8uwx7vhk	PRESENT	0	\N	2026-11-03 10:27:50.62
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
cmw0jnujp000610tzjjppc0b0	Mathématiques
cmw0jnujr000710tz8rm72bb4	Français
cmw0k0v1p000f10eyiwnhziov	Physique
cmw0k12hv000g10eyvzyugzfd	Malagasy
cmw0k18n0000h10eyur4yqid6	Histoire
\.


--
-- Data for Name: Teacher; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Teacher" (id, "userId", "hourlyRate") FROM stdin;
cmw0jnujd000110tz96pjeedm	cmw0jnujd000210tzpff0duop	8000.00
cmw0jnujj000310tzjg6yepxc	cmw0jnujj000410tzavkn8d72	9000.00
\.


--
-- Data for Name: TeacherAttendance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TeacherAttendance" (id, "sessionId", "teacherId", status, "arrivedAt", "leftAt", note) FROM stdin;
cmw0jnupz001n10tzpcxo21t5	cmw0jnupa000x10tzqoa6m66t	cmw0jnujd000110tz96pjeedm	PRESENT	\N	\N	\N
cmw0jnuq5001z10tzhnwj9iq4	cmw0jnupe000z10tz5auynnpq	cmw0jnujj000310tzjg6yepxc	LATE	2026-11-02 08:20:00	\N	\N
cmw0jnut2002b10tzf2atr4yh	cmw0jnupg001110tzy9fa2d6y	cmw0jnujd000110tz96pjeedm	PRESENT	\N	\N	\N
cmw0jnutd002n10tza0kgpcy7	cmw0jnupi001310tzb6lmepzs	cmw0jnujj000310tzjg6yepxc	LATE	2026-10-31 08:20:00	\N	\N
cmw0jnutl002z10tzbjas5vrm	cmw0jnupk001510tz6gi3wku3	cmw0jnujd000110tz96pjeedm	ABSENT	\N	\N	\N
cmw0jnuts003b10tznv1v2fem	cmw0jnupm001710tztttbpn1x	cmw0jnujj000310tzjg6yepxc	LATE	2026-10-29 08:20:00	\N	\N
cmw0jnuu1003n10tzko40nbx3	cmw0jnupp001910tzs75ps3s9	cmw0jnujd000110tz96pjeedm	ABSENT	\N	\N	\N
cmw0jnuu8003z10tz5lyuni9b	cmw0jnupr001b10tzdah6tme9	cmw0jnujj000310tzjg6yepxc	LATE	2026-10-27 08:20:00	\N	\N
\.


--
-- Data for Name: Term; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Term" (id, name, "startDate", "endDate") FROM stdin;
cmw0jnuua004010tz96c12b3z	Trimestre 1	2026-09-04 00:00:00	2027-01-02 00:00:00
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, email, "passwordHash", name, role, active, "createdAt", phone, "photoUrl") FROM stdin;
cmw0jnuj4000010tzagqikysr	admin@ecole.mg	$2a$10$H.9DXVqN8ckscX7n5zdpIOtenM3QP52B8inKc4BZsvDzsAv2elVfe	Administrateur	ADMIN	t	2026-11-03 10:27:50.224	\N	\N
cmw0jnujd000210tzpff0duop	rakoto@ecole.mg	$2a$10$H.9DXVqN8ckscX7n5zdpIOtenM3QP52B8inKc4BZsvDzsAv2elVfe	Rakoto Jean	TEACHER	t	2026-11-03 10:27:50.233	\N	\N
cmw0jnujj000410tzavkn8d72	rasoa@ecole.mg	$2a$10$H.9DXVqN8ckscX7n5zdpIOtenM3QP52B8inKc4BZsvDzsAv2elVfe	Rasoa Marie	TEACHER	t	2026-11-03 10:27:50.24	\N	\N
cmw0jnujz000d10tzmcc1lz01	andry@ecole.mg	$2a$10$MVkVqEllDOBQbzFITD2SX.ZT9qk8H6OqwN8tHiKG0JLJlsigJCTpq	Andry Randria	STUDENT	t	2026-11-03 10:27:50.255	\N	\N
cmw0jnuk5000f10tzy2k1w2bm	bodo@ecole.mg	$2a$10$MVkVqEllDOBQbzFITD2SX.ZT9qk8H6OqwN8tHiKG0JLJlsigJCTpq	Bodo Ravelo	STUDENT	t	2026-11-03 10:27:50.261	\N	\N
cmw0jnuk9000h10tzx2l9rrjp	chloe@ecole.mg	$2a$10$MVkVqEllDOBQbzFITD2SX.ZT9qk8H6OqwN8tHiKG0JLJlsigJCTpq	Chloé Rakoto	STUDENT	t	2026-11-03 10:27:50.265	\N	\N
cmw0jnukd000j10tzxwm6sqmw	dina@ecole.mg	$2a$10$MVkVqEllDOBQbzFITD2SX.ZT9qk8H6OqwN8tHiKG0JLJlsigJCTpq	Dina Rasoa	STUDENT	t	2026-11-03 10:27:50.27	\N	\N
cmw0jnukh000l10tzwzhf67rc	eric@ecole.mg	$2a$10$MVkVqEllDOBQbzFITD2SX.ZT9qk8H6OqwN8tHiKG0JLJlsigJCTpq	Eric Andrianina	STUDENT	t	2026-11-03 10:27:50.274	\N	\N
cmw0jnukl000n10tz4wumubxn	faly@ecole.mg	$2a$10$MVkVqEllDOBQbzFITD2SX.ZT9qk8H6OqwN8tHiKG0JLJlsigJCTpq	Faly Hery	STUDENT	t	2026-11-03 10:27:50.278	\N	\N
cmw0jnuoj000p10tzcor84fr5	gaby@ecole.mg	$2a$10$MVkVqEllDOBQbzFITD2SX.ZT9qk8H6OqwN8tHiKG0JLJlsigJCTpq	Gaby Razafy	STUDENT	t	2026-11-03 10:27:50.419	\N	\N
cmw0jnuos000r10tz9rxljabc	hery@ecole.mg	$2a$10$MVkVqEllDOBQbzFITD2SX.ZT9qk8H6OqwN8tHiKG0JLJlsigJCTpq	Hery Ranaivo	STUDENT	t	2026-11-03 10:27:50.428	\N	\N
cmw0jnup1000t10tzmhm323px	iony@ecole.mg	$2a$10$MVkVqEllDOBQbzFITD2SX.ZT9qk8H6OqwN8tHiKG0JLJlsigJCTpq	Iony Rabe	STUDENT	t	2026-11-03 10:27:50.437	\N	\N
cmw0jnup6000v10tzazwiv3la	jao@ecole.mg	$2a$10$MVkVqEllDOBQbzFITD2SX.ZT9qk8H6OqwN8tHiKG0JLJlsigJCTpq	Jao Rakotomalala	STUDENT	t	2026-11-03 10:27:50.442	\N	\N
\.


--
-- Data for Name: UserPhoto; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UserPhoto" ("userId", data, mime, "updatedAt") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
adb3cbe6-737e-453c-9be6-bf18ca692b3b	552b849c0721bfb16a7ae86b7e3df5d094471d1b74a586197b533bf1f8896caa	2026-11-03 13:27:33.700348+03	20261102060609_init_fr	\N	\N	2026-11-03 13:27:33.486142+03	1
4615ea0f-9ee8-426d-90a7-f6e194e531de	6121cadbc795e9d04a70cf3d2e61084ae5da6d314e40b2dd9f63fffa3b35bbe3	2026-11-03 13:27:33.717796+03	20261102120000_student_photo	\N	\N	2026-11-03 13:27:33.701158+03	1
26425baa-d96c-4cda-8a36-ea321ce13ed4	6b092d997992d86fccbfaf834b13897b0c3cb9669c7a0e9e0d78f1d59cbbc399	2026-11-03 13:27:33.733144+03	20261103090000_user_photo_phone	\N	\N	2026-11-03 13:27:33.718667+03	1
b141468f-93a9-4cf7-a7ff-d700d109c44a	802b5a34f3ea74216353193a8a8ee655d09ffaead59c0e29febd1cbac53226b4	2026-11-03 13:27:47.880539+03	20261103102747_sary	\N	\N	2026-11-03 13:27:47.779648+03	1
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

\unrestrict GFek27ZBb21idgYXI6ZzsKgNoaI09381EchwYaDPUQPbLUeVUQsaE3JrJP4P54s

