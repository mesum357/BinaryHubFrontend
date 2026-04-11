require('./config/loadEnv');
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const { connectDatabase } = require('./config/db');
const flash = require('connect-flash');
const session = require('express-session');

const {
  Course,
  Service,
  TeamMember,
  Event,
  Visit,
  Internship,
  Enrollment,
  InternApplication,
  PaymentRequest,
  PaymentSettings
} = require('./models');
const { groupTeamMembers } = require('./lib/groupTeamByDepartment');

const uploadRoot = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
const publicUploads = '/uploads';

const app = express();
const PORT = process.env.WEBSITE_PORT || 3000;

connectDatabase();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'binaryhub-site-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 86400000 }
  })
);
app.use(flash());
app.use((req, res, next) => {
  res.locals.successMsg = req.flash('success');
  res.locals.errorMsg = req.flash('error');
  next();
});

app.get('/favicon.ico', (req, res) => {
  res.redirect(301, '/images/logo-binary.png');
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(publicUploads, express.static(uploadRoot));

const { uploadEnrollment, uploadInternApply } = require('./middleware/upload')(uploadRoot);

app.get('/', async (req, res) => {
  try {
    const [enrollmentCount, courseCount, teamMemberCount, homeServices] = await Promise.all([
      Enrollment.countDocuments(),
      Course.countDocuments(),
      TeamMember.countDocuments(),
      Service.find().sort({ createdAt: -1 }).limit(6).lean()
    ]);
    res.render('ai_studio_code', {
      enrollmentCount,
      courseCount,
      teamMemberCount,
      homeServices: homeServices || []
    });
  } catch (e) {
    res.render('ai_studio_code', {
      enrollmentCount: 0,
      courseCount: 0,
      teamMemberCount: 0,
      homeServices: []
    });
  }
});

app.get('/courses', async (req, res) => {
  const emptyPaymentSettings = {
    easypaisaNumber: '',
    easypaisaAccountTitle: '',
    bankName: '',
    bankAccountNumber: '',
    bankAccountTitle: '',
    bankIban: '',
    additionalBankNotes: ''
  };
  try {
    const [courses, enrollmentCount, settingsDoc] = await Promise.all([
      Course.find().sort({ createdAt: -1 }).lean(),
      Enrollment.countDocuments(),
      PaymentSettings.findOne().lean()
    ]);
    const list = courses || [];
    const categories = [...new Set(list.map((c) => c.category).filter(Boolean))];
    res.render('course', {
      courses: list,
      enrollmentCount: enrollmentCount || 0,
      courseCount: list.length,
      trackCount: categories.length || 0,
      paymentSettings: settingsDoc ? { ...emptyPaymentSettings, ...settingsDoc } : emptyPaymentSettings
    });
  } catch (e) {
    res.render('course', {
      courses: [],
      enrollmentCount: 0,
      courseCount: 0,
      trackCount: 0,
      paymentSettings: emptyPaymentSettings
    });
  }
});

app.get('/courses/:slug', async (req, res) => {
  try {
    const course = await Course.findOne({ slug: req.params.slug }).lean();
    if (!course) {
      return res.status(404).render('404', { message: 'Course not found' });
    }
    res.render('course-detail', { course });
  } catch (e) {
    res.status(404).render('404', { message: 'Course not found' });
  }
});

app.post('/courses/enroll', (req, res, next) => {
  uploadEnrollment(req, res, (err) => {
    if (err) {
      req.flash('error', err.message || 'Please upload a valid image file (screenshot).');
      return res.redirect('/courses');
    }
    next();
  });
}, async (req, res) => {
  let redirectTo = '/courses';
  try {
    const {
      studentName,
      email,
      phone,
      education,
      city,
      courseId,
      courseName,
      payType,
      transactionId,
      amount
    } = req.body;

    const screenshot = req.file ? `${publicUploads}/${req.file.filename}` : '';

    let courseRef = null;
    if (courseId && mongoose.isValidObjectId(courseId)) {
      courseRef = courseId;
    }

    await PaymentRequest.create({
      studentName,
      email,
      phone: phone || '',
      department: education || '',
      transactionId: transactionId || 'N/A',
      paymentMethod: payType || 'bank',
      screenshot,
      amount: parseFloat(String(amount).replace(/[^\d.]/g, '')) || 0,
      status: 'pending',
      course: courseRef,
      courseName: courseName || '',
      education: education || '',
      city: city || ''
    });

    await Enrollment.create({
      studentName,
      email,
      phone: phone || '',
      education: education || '',
      city: city || '',
      course: courseRef,
      courseName: courseName || ''
    });

    req.flash('success', 'Application received. We will verify your payment and contact you soon.');
    if (courseRef) {
      const c = await Course.findById(courseRef).select('slug').lean();
      if (c && c.slug) redirectTo = `/courses/${c.slug}`;
    }
  } catch (err) {
    console.error(err);
    req.flash('error', 'Could not submit enrollment. Please try again.');
  }
  res.redirect(redirectTo);
});

app.get('/team', async (req, res) => {
  try {
    const teamMembers = await TeamMember.find().sort({ createdAt: -1 }).lean();
    const list = teamMembers || [];
    const teamByDept = groupTeamMembers(list);
    const teamCount = list.length;
    const deptCount = ['CEO', 'Developer', 'Designer', 'Marketer'].filter((d) => teamByDept[d].length > 0)
      .length;
    const ceoCount = teamByDept.CEO.length;
    res.render('OurTeam', {
      teamMembers: list,
      teamByDept,
      teamCount,
      deptCount,
      ceoCount
    });
  } catch (e) {
    const empty = { CEO: [], Developer: [], Designer: [], Marketer: [], Other: [] };
    res.render('OurTeam', {
      teamMembers: [],
      teamByDept: empty,
      teamCount: 0,
      deptCount: 0,
      ceoCount: 0
    });
  }
});

app.get('/events', async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 }).lean();
    res.render('events', { events: events || [] });
  } catch (e) {
    res.render('events', { events: [] });
  }
});

app.get('/visits', async (req, res) => {
  try {
    const visits = await Visit.find().sort({ createdAt: -1 }).lean();
    res.render('visits', { visits: visits || [] });
  } catch (e) {
    res.render('visits', { visits: [] });
  }
});

app.get('/internships', async (req, res) => {
  try {
    const internships = await Internship.find().sort({ createdAt: -1 }).lean();
    res.render('internships', { internships: internships || [] });
  } catch (e) {
    res.render('internships', { internships: [] });
  }
});

app.post('/internships/apply', uploadInternApply.none(), async (req, res) => {
  try {
    const { name, email, phone, cnic, department, education, internshipId } = req.body;
    let internshipRef = null;
    if (internshipId && mongoose.isValidObjectId(internshipId)) {
      internshipRef = internshipId;
    }
    await InternApplication.create({
      name,
      email,
      phone: phone || '',
      cnic: cnic || '',
      department: department || '',
      education: education || '',
      internship: internshipRef
    });
    req.flash('success', 'Application received. We will email you within a few business days.');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Could not submit application.');
  }
  res.redirect('/internships');
});

app.get('/services', async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 }).lean();
    res.render('services', { services: services || [] });
  } catch (e) {
    res.render('services', { services: [] });
  }
});

app.get('/services/:slug', async (req, res) => {
  try {
    const service = await Service.findOne({ slug: req.params.slug }).lean();
    if (!service) {
      return res.status(404).render('404', { message: 'Service not found' });
    }
    res.render('service-detail', { service, mode: 'server' });
  } catch (e) {
    res.status(404).render('404', { message: 'Service not found' });
  }
});

const impactIds = ['youth-empowerment', 'women-empowerment', 'tourist-promotion', 'vocational-center'];

app.get('/impact/:id', async (req, res) => {
  if (!impactIds.includes(req.params.id)) {
    return res.status(404).render('404', { message: 'Not found' });
  }
  res.render('impact-detail', { impactId: req.params.id, mode: 'static' });
});

app.get('/our-mission', (req, res) => res.render('our-mission'));
app.get('/impact', (req, res) => res.render('impact'));
app.get('/branches', (req, res) => res.render('branches'));

app.get('*', (req, res) => {
  if (req.path.startsWith('/uploads')) return res.status(404).send('Not found');
  res.status(404).render('404', { message: 'Page not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Server error');
});

app.listen(PORT, () => {
  console.log(`Website http://localhost:${PORT}`);
});
