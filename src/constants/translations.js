export const translations = {
  en: {
    common: {
      search: "Search...",
      save: "Save",
      cancel: "Cancel",
      edit: "Edit",
      delete: "Delete",
      view: "View",
      actions: "Actions",
      status: "Status",
      date: "Date",
      name: "Name",
      loading: "Loading...",
      required: "Required",
      noData: "No data found",
      back: "Back",
      next: "Next",
      submit: "Submit",
      confidential: "SUSPECT",
      days: {
        monday: "Monday",
        tuesday: "Tuesday",
        wednesday: "Wednesday",
        thursday: "Thursday",
        friday: "Friday",
        saturday: "Saturday",
        sunday: "Sunday",
        all: "All Reporting Days"
      }
    },
    nav: {
      dashboard: "Dashboard",
      cases: "Case Files",
      evidences: "Evidences and Findings",
      photoAlbum: "Photo Album",
      caseProgression: "Case Progression",
      habitualCriminals: "Habitual Criminals",
      courtAssessment: "Court Assessment",
      auditLogs: "Audit Logs",
      settings: "Settings",
      logout: "Logout",
      profile: "Profile"
    },
    dashboard: {
      title: "Dashboard Overview",
      subtitle: "Muriet Police Investigation Department Monitoring System",
      metrics: {
        totalCases: "Total Cases",
        activeInvestig: "Active Investigation",
        courtBound: "Court Bound",
        closedCases: "Closed Cases",
        openCases: "Total Open Cases",
        inCourt: "Cases In Court",
        reportingToday: "Habituals Reporting Today"
      },
      quickActions: {
        title: "Quick Actions",
        createCase: "Create New Case",
        viewAlbum: "Photo Album",
        courtOverview: "Court Assessment",
        habitualRecords: "Habitual Records",
        investigationDesc: "Initialize a new investigation",
        photoDesc: "View criminal mugshots",
        courtDesc: "Track legal proceedings",
        habitualDesc: "Monitor repeat offenders"
      },
      deptName: "Muriet Police Investigation Dept.",
      corePerformance: "Core Performance Metrics",
      activeHabituals: "Active Habituals",
      recentActivity: "Recent Activity",
      noActivity: "No recent activity.",
      byOfficer: "By"
    },
    cases: {
      title: "Case Files",
      subtitle: "Official Case Registry & Investigation Records",
      initBtn: "Initialize Case",
      syncBtn: "Cloud Sync",
      draftsBtn: "Drafts",
      cloudSearchBtn: "Cloud Search",
      searchPlaceholder: "Search files...",
      table: {
        rb: "RB NUMBER",
        title: "CASE TITLE",
        suspect: "SUSPECT NAME",
        date: "DATE LOGGED",
        investigator: "INVESTIGATOR",
        status: "STATUS",
        action: "ACTION"
      },
      footer: {
        showing: "Showing",
        to: "to",
        of: "of",
        entries: "entries",
        prev: "Prev",
        next: "Next"
      },
      modal: {
        initTitle: "Initialize New Case",
        viewTitle: "Case Details",
        sections: {
          reference: "CASE REFERENCE",
          evaluation: "PRE-EVALUATION DATA",
          bioData: "SUSPECT BIO-DATA",
          accomplice: "ACCOMPLICE DETAILS"
        },
        fields: {
          rbNum: "RB Number (Serial)",
          year: "Year",
          date: "Date of Incident / Crime",
          reportingDate: "Date of Reporting",
          title: "Primary Crime / Title",
          source: "Source of Information",
          sourcePlaceholder: "How was the crime reported? (Phone call / Actual reporting)",
          location: "Incident Location",
          locationPlaceholder: "Where the incident happened",
          findings: "Preliminary Findings & Actions Taken",
          findingsPlaceholder: "Describe actions taken before reporting (Who, Where, Why)",
          fullName: "Full Name",
          namePlaceholder: "LEGAL NAME IN BOLD...",
          dob: "Date of Birth / Age",
          birthPlace: "Birth: Country / City / Street",
          residence: "Residence: Country / City / Street",
          country: "Country",
          city: "City",
          street: "Street",
          occupation: "Occupation",
          phone: "Phone Number",
          nida: "National ID (NIDA)",
          hasAccomplice: "Has Accomplices?",
          accompliceName: "Accomplice Full Name",
          accompliceLabel: "Accomplice",
          addAccomplice: "ADD ANOTHER ACCOMPLICE",
          remove: "REMOVE"
        }
      },
      scanning: "SCANNING FINGERPRINTS...",
      syncing: "Syncing with cloud database...",
      syncSuccess: "Done! Synced",
      draftSaved: "Latest draft saved to cloud.",
      draftRestored: "Cloud draft successfully restored.",
      details: {
        tabs: {
          bio: "Bio Data",
          reporting: "Reporting",
          investigation: "Evidence & Exhibits",
          witnesses: "Witness Statements",
          forensics: "Forensics",
          legal: "Legal / SA Review"
        },
        sections: {
          classification: "Classification & Overview",
          media: "Case Attachments & Media"
        },
        back: "Back",
        frozen: "RECORD FROZEN (CHAIN OF CUSTODY)",
        loading: "Module Content Loading...",
        noAccomplices: "No accomplices recorded for this case.",
        evidenceTitle: "Evidence & Seized Exhibits",
        logExhibit: "Log Exhibit",
        evidenceTable: {
          desc: "Description",
          location: "Location",
          status: "Status"
        },
        evidenceVerified: "Evidence Verified"
      }
    },
    habituals: {
      title: "Habitual Criminal Registry",
      subtitle: "Monitoring and Evaluation of Repeat Offenders",
      registerBtn: "Register Habitual",
      metrics: {
        total: "Total Registered",
        reportingToday: "Reporting Today",
        missed: "Missed (This Week)"
      },
      table: {
        identity: "CRIMINAL IDENTITY",
        schedule: "SCHEDULED DAYS",
        lastCrime: "LAST CRIME",
        status: "STATUS",
        attendance: "ATTENDANCE",
        actions: "ACTIONS"
      },
      present: "Mark Present",
      reported: "REPORTED",
      pending: "Pending",
      updateBtn: "Update",
      recordAttendance: "Record Attendance",
      lastAttendance: "Last Attendance",
      currentAttendance: "Current Attendance",
      officerNotice: "Officer Notice",
      noticePlaceholder: "Enter any observations or notes...",
      modal: {
        title: "Register Habitual Criminal",
        fields: {
          name: "Full Name",
          nida: "National ID (NIDA)",
          phone: "Phone",
          crime: "Primary / Last Crime",
          reportingDays: "Assigned Reporting Days"
        },
        monitored: "Monitored Individuals",
        noHabituals: "No individuals registered.",
        never: "Never"
      }
    },
    evidences: {
      title: "Evidences and Findings",
      subtitle: "Secured Pre-evaluation Findings & Digital Evidence Registry",
      uploadBtn: "Upload Evidence",
      addFindingBtn: "Add Pre-evaluation Finding",
      sections: {
        findings: "Pre-evaluation Findings",
        evidence: "Physical & Digital Evidence"
      },
      findings: {
        title: "Pre-evaluation Finding Details",
        description: "Observation Description",
        placeTaken: "Place Taken",
        dateTaken: "Date Taken",
        attachments: "Attachments",
        noAttachments: "No attachments for this finding.",
        updateSuccess: "Finding updated successfully.",
        addSuccess: "New finding logged successfully.",
        selectCase: "Please select a case first.",
        fillRequired: "Please fill required fields"
      },
      table: {
        id: "EVID ID",
        type: "TYPE",
        addedBy: "ADDED BY",
        status: "STATUS"
      },
      upload: {
        drag: "Drag files here to secure",
        browse: "or click to browse from device",
        link: "Link to Case File",
        selector: "Select Target Case...",
        status: {
          uploading: "Uploading",
          scanning: "Scanning",
          securing: "Securing",
          complete: "Evidence Secured"
        },
        progress: {
          transferring: "Transferring file to secure vault...",
          checking: "Running antivirus and malware integrity check...",
          encrypting: "Applying AES-256 encryption and hashing..."
        },
        success: "File has been encrypted and added to the official record.",
        more: "Upload More",
        refresh: "Refresh List"
      },
      policy: {
        title: "Digital Evidence Security Policy",
        btn: "View Digital Policy",
        note: "Chain of custody is strictly enforced.",
        disclaimer: "All uploaded evidence is subject to the Muriet Police Investigation Department digital evidence policy.",
        acknowledge: "Acknowledge Policy",
        sections: {
          integrity: "1. Data Integrity",
          integrityDesc: "Every file is hashed using SHA-256 upon reception. Any modification post-upload will trigger a security audit.",
          encryption: "2. Encryption",
          encryptionDesc: "Documents are encrypted at rest using AES-256 standards. Keys are managed by the Muriet Station secure vault.",
          access: "3. Access Control",
          accessDesc: "Only authorized officers have authority to view original evidence files."
        }
      },
      recent: "Recent Uploads",
      noFiles: "No files uploaded in this session."
    },
    court: {
      title: "Court Assessment",
      subtitle: "Legal Proceedings & Judicial Status Tracking",
      table: {
        caseId: "CASE ID",
        court: "COURT NAME",
        nextDate: "NEXT HEARING",
        judge: "JUDGE/MAGISTRATE",
        suspect: "SUSPECT",
        status: "STATUS",
        action: "ACTION"
      },
      proceedings: {
        title: "Court Proceedings Log",
        addBtn: "Add Entry",
        newEntry: "New Entry",
        placeholder: "Record court outcome, next date or verdict details...",
        noCases: "No court cases found.",
        courtLabel: "Court:",
        stageLabel: "Stage:",
        verdictLabel: "Final Verdict:",
        addNote: "Add Proceedings Note",
        notePlaceholder: "e.g., Pw1 gave evidence. Exhibits 1-3 admitted..."
      }
    },
    photos: {
      title: "Photo Album & Mugshots",
      subtitle: "Secure repository for viewing mugshots and suspect identification.",
      placeholderName: "Suspect Name Placeholder",
      noPhotos: "No mugshots have been uploaded yet.",
      unavailable: "Image unavailable"
    },
    progression: {
      title: "Case Progression Tracker",
      subtitle: "Monitoring the investigation timeline and milestone completion.",
      table: {
        rb: "RB Number",
        crime: "Crime",
        status: "Status",
        lastAction: "Last Action"
      },
      saDecision: "SA Decision",
      noProgression: "No case progressions found."
    },
    audit: {
      title: "Security Audit Logs",
      subtitle: "Traceability and accountability of all system actions.",
      accountability: "High-Level Accountability",
      table: {
        timestamp: "TIMESTAMP",
        actor: "ACTOR",
        action: "ACTION",
        details: "DETAILS"
      },
      noLogs: "No audit logs found."
    },
    auth: {
      headers: {
        country: "The United Republic of Tanzania",
        portal: "MURIET POLICE PORTAL",
        mottoSw: "KWA USALAMA WA RAIA NA MALI ZAO",
        mottoEn: "For the safety of citizens and their property"
      },
      login: {
        welcomeTitle: "Welcome",
        welcomeSubtitle: "Login into Muriet Police Portal",
        emailBadgeLabel: "Email / Badge Number",
        emailPlaceholder: "name@agency.gov",
        passwordLabel: "Password",
        passwordPlaceholder: "••••••••",
        authenticating: "Authenticating...",
        signInBtn: "Sign In",
        forgotPasswordLink: "Forgot Password?",
        invalidLogin: "Invalid email or password. Please try again or contact ICT."
      },
      resetMode: {
        title: "Reset Password",
        subtitle: "Secure account recovery system",
        instruction: "Enter your official email address to receive a secure password reset link.",
        emailLabel: "Official Email",
        checking: "Checking...",
        requestBtn: "Request Reset Link",
        backToSignInBtn: "Back to Sign In",
        successMsg: "A secure password reset link has been dispatched to your official email account."
      },
      footer: {
        supportMsg: "For any Technical inquiry, Please contact your",
        supportTeam: "ICT Support Team",
        copyright: "Copyright ©2026 | TANZANIA POLICE FORCE. All right reserved. Muriet Police Portal v1.0"
      }
    },
    registerOfficer: {
      success: {
        title: "Registration Successful",
        descPart1: "Officer",
        descPart2: "has been successfully registered to the database.",
        btnNext: "Register Another Officer",
        toastSuccess: "Officer {name} registered successfully.",
        toastFail: "Failed to register officer."
      },
      form: {
        title: "Register Officer",
        subtitle: "Authorized access: OCS Personnel Registration",
        fullNameLabel: "Full Name",
        fullNamePlaceholder: "e.g. Inspector Kamau",
        badgeNumLabel: "Badge Number",
        badgeNumPlaceholder: "e.g. PT-1234",
        roleLabel: "Assigned Role",
        roleIo: "Investigating Officer (IO)",
        roleOcCid: "Head of CID (OC-CID)",
        roleOcs: "Station Commander (OCS)",
        emailLabel: "Official Email",
        emailPlaceholder: "name@police.go.tz",
        tempPassLabel: "Temporary Password",
        tempPassPlaceholder: "Minimum 6 characters",
        processing: "Processing...",
        submitBtn: "Register Officer Now"
      },
      guidelines: {
        title: "Officer Account Management & Guidelines",
        creationTitle: "Subordinate Account Creation",
        creationDesc: "As the Station Commander (OCS), you have the primary authority to initialize accounts for all subordinate officers within your jurisdiction. Every detail entered must strictly match official records, as these credentials form the basis for audit trailing and legal accountability in case file management. Each account is securely bound to a unique Badge Number and verified Official Police Email.",
        accessTitle: "Login & Access Procedures",
        accessDesc: "Immediately after registration, the designated officer must access the portal using their official email and the temporary credentials you generated. Upon initial authentication, the system mandates a security-enforced password update. Application permissions are dynamically assigned based on the selected role (IO, OC-CID), ensuring strict adherence to the chain of custody and data integrity standards."
      }
    }
  },
  sw: {
    common: {
      search: "Tafuta...",
      save: "Hifadhi",
      cancel: "Ghairi",
      edit: "Hariri",
      delete: "Futa",
      view: "Angalia",
      actions: "Hatua",
      status: "Hali",
      date: "Tarehe",
      name: "Jina",
      loading: "Inapakia...",
      required: "Inahitajika",
      noData: "Hakuna data",
      back: "Nyuma",
      next: "Mbele",
      submit: "Wasilisha",
      confidential: "MTUHUMIWA",
      days: {
        monday: "Jumatatu",
        tuesday: "Jumanne",
        wednesday: "Jumatano",
        thursday: "Alhamisi",
        friday: "Ijumaa",
        saturday: "Jumamosi",
        sunday: "Jumapili",
        all: "Siku Zote za Kuripoti"
      }
    },
    nav: {
      dashboard: "Dashibodi",
      cases: "Mafaili ya Kesi",
      evidences: "Vielelezo na Matokeo",
      photoAlbum: "Albamu ya Picha",
      caseProgression: "Mwenendo wa Kesi",
      habitualCriminals: "Wahusika Sugu",
      courtAssessment: "Tathmini ya Mahakama",
      auditLogs: "Kumbukumbu za Ukaguzi",
      settings: "Mipangilio",
      logout: "Ondoka",
      profile: "Wasifu"
    },
    dashboard: {
      title: "Muhtasari wa Dashibodi",
      subtitle: "Mfumo wa Usimamizi wa Idara ya Upelelezi ya Polisi Muriet",
      metrics: {
        totalCases: "Jumla ya Kesi",
        activeInvestig: "Upelelezi Unaoendelea",
        courtBound: "Zilizopelekwa Mahakamani",
        closedCases: "Kesi Zilizofungwa",
        openCases: "Jumla ya Kesi Zilizofunguliwa",
        inCourt: "Kesi Zilizoko Mahakamani",
        reportingToday: "Wahalifu Sugu Wanaoripoti Leo"
      },
      quickActions: {
        title: "Hatua za Haraka",
        createCase: "Anzisha Kesi Mpya",
        viewAlbum: "Albamu ya Picha",
        courtOverview: "Tathmini ya Mahakama",
        habitualRecords: "Kumbukumbu za Sugu",
        investigationDesc: "Anzisha upelelezi mpya",
        photoDesc: "Angalia picha za wahalifu",
        courtDesc: "Fuatilia mwenendo wa kisheria",
        habitualDesc: "Fuatilia wahalifu wanaojirudia"
      },
      deptName: "Idara ya Upelelezi Polisi Muriet",
      corePerformance: "Vigezo Muhimu vya Utendaji",
      activeHabituals: "Wahalifu Wanaofuatiliwa",
      recentActivity: "Hatua za Hivi Karibuni",
      noActivity: "Hakuna shughuli za hivi karibuni.",
      byOfficer: "Na"
    },
    cases: {
      title: "Mafaili ya Kesi",
      subtitle: "Sajili Rasmi ya Kesi na Kumbukumbu za Upelelezi",
      initBtn: "Anzisha Kesi",
      syncBtn: "Sawazisha Mfumo",
      draftsBtn: "Rasimu",
      cloudSearchBtn: "Tafuta Mfumo",
      searchPlaceholder: "Tafuta majalada...",
      table: {
        rb: "NAMBARI YA RB",
        title: "AINA YA KESI",
        suspect: "JINA LA MTUHUMIWA",
        date: "TAREHE",
        investigator: "MPELELEZI",
        status: "HALI",
        action: "HATUA"
      },
      footer: {
        showing: "Inaonyesha",
        to: "hadi",
        of: "kati ya",
        entries: "",
        prev: "Nyuma",
        next: "Mbele"
      },
      modal: {
        initTitle: "Anzisha Kesi Mpya",
        viewTitle: "Maelezo ya Kesi",
        sections: {
          reference: "REJEA YA KESI",
          evaluation: "MAELEZO YA AWALI",
          bioData: "TAARIFA ZA MTUHUMIWA",
          accomplice: "MAELEZO YA MSHIRIKI"
        },
        fields: {
          rbNum: "Nambari ya RB (Serial)",
          year: "Mwaka",
          date: "Tarehe ya Tukio / Kosa",
          reportingDate: "Tarehe ya Kutoa Taarifa",
          title: "Kosa la Msingi / Kichwa cha Habari",
          source: "Chanzo cha Taarifa",
          sourcePlaceholder: "Kosa liliripotiwaje? (Simu / Kufika Kituoni)",
          location: "Eneo la Tukio",
          locationPlaceholder: "Ambapo tukio lilitokea",
          findings: "Matokeo ya Awali na Hatua Zilizochukuliwa",
          findingsPlaceholder: "Elezea hatua zilizochukuliwa kabla ya kutoa taarifa (Nani, Wapi, Kwa nini)",
          fullName: "Jina Kamili",
          namePlaceholder: "JINA LA KISHERIA KWA HERUFI KUBWA...",
          dob: "Tarehe ya Kuzaliwa / Umri",
          birthPlace: "Kuzaliwa: Nchi / Jiji / Mtaa",
          residence: "Makazi: Nchi / Jiji / Mtaa",
          country: "Nchi",
          city: "Jiji",
          street: "Mtaa",
          occupation: "Kazi",
          phone: "Nambari ya Simu",
          nida: "Nambari ya Utambulisho (NIDA)",
          hasAccomplice: "Je, ana Washiriki?",
          accompliceName: "Jina Kamili la Mshiriki",
          accompliceLabel: "Mshiriki",
          addAccomplice: "ONGEZA MSHIRIKI MWINGINE",
          remove: "ONDOA"
        }
      },
      scanning: "INASOMA ALAMA ZA VIDOLE...",
      syncing: "Kumbukumbu inatunzwa...",
      syncSuccess: "Sawa! Data zipo sahihi!",
      draftSaved: "Kumbukumbu imehifadhiwa.",
      draftRestored: "Kumbukumbu imerejeshwa.",
      details: {
        tabs: {
          bio: "Wasifu",
          reporting: "Taarifa",
          investigation: "Ushahidi na Vielelezo",
          witnesses: "Maelezo ya Mashahidi",
          forensics: "Uchunguzi wa Kitaalam",
          legal: "Mapitio ya Kisheria"
        },
        sections: {
          classification: "Uainishaji na Muhtasari",
          media: "Viambatisho vya Kesi na Picha"
        },
        back: "Nyuma",
        frozen: "KUMBUKUMBU IMEFUNGWA (USALAMA WA USHAHIDI)",
        loading: "Maudhui yanapakiwa...",
        noAccomplices: "Hakuna washiriki waliorekodiwa kwa kesi hii.",
        evidenceTitle: "Ushahidi na Vielelezo Vilivyokamatwa",
        logExhibit: "Sajili Kielelezo",
        evidenceTable: {
          desc: "Maelezo",
          location: "Mahali",
          status: "Hali"
        },
        evidenceVerified: "Ushahidi Umethibitishwa"
      }
    },
    habituals: {
      title: "Sajili ya Wahalifu Sugu",
      subtitle: "Ufuatiliaji na Tathmini ya Wahalifu Wanaojirudia",
      registerBtn: "Sajili Mhalifu Sugu",
      metrics: {
        total: "Jumla ya Waliosajiliwa",
        reportingToday: "Wanaoripoti Leo",
        missed: "Waliokosa (Wiki Hii)"
      },
      table: {
        identity: "UTAMBULISHO WA MHALIFU",
        schedule: "SIKU ZA KURIPOTI",
        lastCrime: "KOSA LA MWISHO",
        status: "HALI",
        attendance: "MAHUDHURIO",
        actions: "VITENDO"
      },
      present: "Weka Mahudhurio",
      reported: "AMERIPOTI",
      pending: "Inasubiri",
      updateBtn: "Sasisha",
      recordAttendance: "Rekodi Mahudhurio",
      lastAttendance: "Mahudhurio ya Mwisho",
      currentAttendance: "Mahudhurio ya Sasa",
      officerNotice: "Dokezo la Afisa",
      noticePlaceholder: "Ingiza maoni au maelezo yoyote...",
      modal: {
        title: "Sajili Mhalifu Sugu",
        fields: {
          name: "Jina Kamili",
          nida: "NIDA",
          phone: "Simu",
          crime: "Kosa la Msingi / Mwisho",
          reportingDays: "Siku za Kuripoti Alizopangiwa"
        },
        monitored: "Watu Wanaofuatiliwa",
        noHabituals: "Hakuna watu walioorodheshwa.",
        never: "Kamwe"
      }
    },
    evidences: {
      title: "Vielelezo na Matokeo",
      subtitle: "Sajili Iliyolindwa ya Matokeo ya Awali na Vielelezo vya Kidijitali",
      uploadBtn: "Pakia Kielelezo",
      addFindingBtn: "Weka Matokeo ya Awali",
      sections: {
        findings: "Matokeo ya Awali (Findings)",
        evidence: "Vielelezo vya Kimwili na Kidijitali"
      },
      findings: {
        title: "Maelezo ya Matokeo ya Awali",
        description: "Maelezo ya Uchunguzi",
        placeTaken: "Mahali Palipochukuliwa",
        dateTaken: "Tarehe Iliyochukuliwa",
        attachments: "Viambatanisho",
        noAttachments: "Hakuna viambatanisho vya matokeo haya.",
        updateSuccess: "Matokeo yamesasishwa kikamilifu.",
        addSuccess: "Matokeo mapya yamerekodiwa kikamilifu.",
        selectCase: "Tafadhali chagua kesi kwanza.",
        fillRequired: "Tafadhali jaza sehemu zinazohitajika"
      },
      table: {
        id: "NAMBARI YA KIELELEZO",
        type: "AINA",
        addedBy: "IMEPAKIWA NA",
        status: "HALI"
      },
      upload: {
        drag: "Buruta faili hapa kuambatanisha",
        browse: "au bofya ili kuchagua faili",
        link: "Unganisha na Jalada la Kesi",
        selector: "Chagua Kesi Inayohusika...",
        status: {
          uploading: "Inapakia",
          scanning: "Inakagua",
          securing: "Inalinda",
          complete: "Kielelezo Kimehifadhiwa"
        },
        progress: {
          transferring: "Inahamisha faili kwenda kwenye sanduku la siri...",
          checking: "Inakagua usalama wa faili...",
          encrypting: "Inatumia encryption ya AES-256 na hashing..."
        },
        success: "Faili imesimbwa na kuongezwa kwenye rekodi rasmi.",
        more: "Pakia Zaidi",
        refresh: "Onesha Upya"
      },
      policy: {
        title: "Sera ya Usalama wa Vielelezo vya Kidijitali",
        btn: "Angalia Sera ya Kidijitali",
        note: "Mnyororo wa umiliki unazingatiwa kikamilifu.",
        disclaimer: "Vielelezo vyote vilivyopakiwa vinakabiliwa na sera ya vielelezo vya kidijitali ya Idara ya Upelelezi ya Polisi Muriet.",
        acknowledge: "Kubali Sera",
        sections: {
          integrity: "1. Uadilifu wa Data",
          integrityDesc: "Kila faili inafanyiwa hash kwa kutumia SHA-256 inapopokelewa. Mabadiliko yoyote yatasababisha ukaguzi wa usalama.",
          encryption: "2. Usimbuaji",
          encryptionDesc: "Nyaraka zinakuwa encrypted kwa kutumia viwango vya AES-256. Funguo zinasimamiwa na sanduku la siri la Kituo cha Muriet.",
          access: "3. Udhibiti wa Ufikiaji",
          accessDesc: "Maafisa walioidhinishwa tu ndio wenye mamlaka ya kuona faili asili za vielelezo."
        }
      },
      recent: "Vilivyopakiwa Hivi Karibuni",
      noFiles: "Hakuna faili zilizopakiwa katika kikao hiki."
    },
    court: {
      title: "Tathmini ya Mahakama",
      subtitle: "Ufuatiliaji wa Mwenendo wa Kisheria na Hali ya Kimahakama",
      table: {
        caseId: "NAMBARI YA KESI",
        court: "JINA LA MAHAKAMA",
        nextDate: "TAREHE IJAYO",
        judge: "JAJI/HAKIMU",
        suspect: "MTUHUMIWA",
        status: "HALI",
        action: "HATUA"
      },
      proceedings: {
        title: "Kumbukumbu za Mwenendo wa Mahakama",
        addBtn: "Weka Taarifa",
        newEntry: "Taarifa Mpya",
        placeholder: "Rekodi matokeo ya mahakama, tarehe ijayo au maelezo ya hukumu...",
        noCases: "Hakuna kesi za mahakama.",
        courtLabel: "Mahakama:",
        stageLabel: "Hatua:",
        verdictLabel: "Uamuzi wa Mwisho:",
        addNote: "Ongeza Kumbukumbu ya Kesi",
        notePlaceholder: "e.g., Pw1 alitoa ushahidi..."
      }
    },
    photos: {
      title: "Albamu ya Picha na Mugshots",
      subtitle: "Hifadhi salama ya kuangalia picha za wahalifu na utambulisho wa watuhumiwa.",
      placeholderName: "Jina la Mtuhumiwa",
      noPhotos: "Hakuna picha zilizopakiwa bado.",
      unavailable: "Picha haipatikani"
    },
    progression: {
      title: "Ufuatiliaji wa Mwenendo wa Kesi",
      subtitle: "Kufuatilia hatua za upelelezi na ukamilishaji wa mambo muhimu.",
      table: {
        rb: "Nambari ya RB",
        crime: "Kosa",
        status: "Hali",
        lastAction: "Hatua ya Mwisho"
      },
      saDecision: "Uamuzi wa SA",
      noProgression: "Hakuna maendeleo ya kesi."
    },
    audit: {
      title: "Kumbukumbu za Ukaguzi wa Usalama",
      subtitle: "Ufuatiliaji na uwajibikaji wa hatua zote za mfumo.",
      accountability: "Uwajibikaji wa Kiwango cha Juu",
      table: {
        timestamp: "MUDA",
        actor: "MTENDAJI",
        action: "HATUA",
        details: "MAELEZO"
      },
      noLogs: "Hakuna kumbukumbu za ukaguzi."
    },
    auth: {
      headers: {
        country: "Jamhuri ya Muungano wa Tanzania",
        portal: "MURIET POLICE PORTAL",
        mottoSw: "KWA USALAMA WA RAIA NA MALI ZAO",
        mottoEn: "For the safety of citizens and their property"
      },
      login: {
        welcomeTitle: "Karibu",
        welcomeSubtitle: "Ingia kwenye Mfumo wa Polisi Muriet",
        emailBadgeLabel: "Barua Pepe / Badge Namba",
        emailPlaceholder: "jina@agency.gov",
        passwordLabel: "Nenosiri",
        passwordPlaceholder: "••••••••",
        authenticating: "Inathibitisha...",
        signInBtn: "Ingia",
        forgotPasswordLink: "Umesahau Nenosiri?",
        invalidLogin: "Barua pepe au nenosiri si sahihi. Tafadhali jaribu tena au wasiliana na ICT."
      },
      resetMode: {
        title: "Weka Upya Nenosiri",
        subtitle: "Mfumo salama wa kurejesha akaunti",
        instruction: "Ingiza barua pepe yako rasmi ili kupokea kiungo cha kuweka upya nenosiri.",
        emailLabel: "Barua Pepe Rasmi",
        checking: "Inakagua...",
        requestBtn: "Omba Kiungo",
        backToSignInBtn: "Rudi nyuma",
        successMsg: "Kiungo salama cha kuweka upya nenosiri kimetumwa kwenye barua pepe yako rasmi."
      },
      footer: {
        supportMsg: "Kwa uchunguzi wowote wa Kiufundi, Tafadhali wasiliana na",
        supportTeam: "Timu ya Msaada ya ICT",
        copyright: "Hakimiliki ©2026 | JESHI LA POLISI TANZANIA. Haki zote zimehifadhiwa. Muriet Police Portal v1.0"
      }
    },
    registerOfficer: {
      success: {
        title: "Umesajiliwa Kikamilifu",
        descPart1: "Afisa",
        descPart2: "amesajiliwa kikamilifu kwenye kanzidata.",
        btnNext: "Sajili Afisa Mwingine",
        toastSuccess: "Afisa {name} amesajiliwa kikamilifu.",
        toastFail: "Kusajili afisa kumeshindikana."
      },
      form: {
        title: "Sajili Afisa",
        subtitle: "Usajili wa Ma-Afisa wa Idara",
        fullNameLabel: "Jina Kamili",
        fullNamePlaceholder: "k.m. Mkaguzi Kamau",
        badgeNumLabel: "Badge Namba",
        badgeNumPlaceholder: "k.m. PT-1234",
        roleLabel: "Cheo Cha Afisa",
        roleIo: "Afisa Upelelezi (IO)",
        roleOcCid: "Mkuu wa CID (OC-CID)",
        roleOcs: "Kamanda wa Kituo (OCS)",
        emailLabel: "Barua Pepe Rasmi",
        emailPlaceholder: "jina@police.go.tz",
        tempPassLabel: "Nenosiri la Muda",
        tempPassPlaceholder: "Angalau herufi 6",
        processing: "Inachakata...",
        submitBtn: "Sajili Afisa Sasa"
      },
      guidelines: {
        title: "Mwongozo wa Usimamizi wa Akaunti za Maafisa",
        creationTitle: "Ufunguzi wa Akaunti kwa Maafisa wa Chini",
        creationDesc: "Kama Mkuu wa Kituo (OCS), unayo mamlaka kamili ya kuwafungulia akaunti maafisa wote walio chini yako. Ni lazima taarifa zitakazowekwa zilingane na kumbukumbu rasmi za kiutumishi, kwani taarifa hizi ndizo msingi wa ukaguzi (audit trail) na uwajibikaji wa kisheria katika uendeshaji wa majalada ya kesi. Kila akaunti imelindwa kwa kutumia Namba ya Askari (PF Number) na Barua Pepe rasmi.",
        accessTitle: "Taratibu za Kuingia na Matumizi ya Mfumo",
        accessDesc: "Baada ya usajili kukamilika, afisa husika atapaswa kuingia kwenye mfumo kwa kutumia barua pepe yake ya kikazi na nenosiri la muda (temporary password) ulilomtengenezea. Mara baada ya kuingia kwa mara ya kwanza, mfumo utamlazimu kubadili nenosiri hilo na kuweka la siri zaidi. Majukumu na uwezo wa kufanya kazi kwenye mfumo yanatolewa kulingana na cheo au nafasi ya afisa (IO au OC-CID), ili kuhakikisha uzingatiaji wa mnyororo wa usimamizi wa ushahidi na usalama wa taarifa."
      }
    }
  }
};
